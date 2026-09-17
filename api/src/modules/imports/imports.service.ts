import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditAction, ImportBatchStatus, Prisma, StagedTransactionStatus, TransactionType } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { IMPORT_PROCESSING_QUEUE } from '@/core/queues/queues.constants';
import { GcsFolders } from '@/integrations/storage/gcs/config/gcs-folders.config';
import { DocumentsService } from '@/modules/documents/documents.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { PositionsService } from '@/modules/positions/positions.service';
import { TemplateDetectionService } from '@/modules/mapping-templates/services/template-detection.service';
import { ParserFactory } from './parsers/parser.factory';
import { detectSourceFileType } from './parsers/file-type.utils';
import { ColumnMappingEngine } from './mapping/column-mapping.engine';
import { StagedRowValidator } from './validation/staged-row-validator';
import { DedupService } from './dedup/dedup.service';
import { ImportBatchQueryType } from './dto/import-batch-query.schema';
import { StagedTransactionQueryType } from './dto/staged-transaction-query.schema';
import { UpdateStagedTransactionDto } from './dto/update-staged-transaction.dto';
import { ColumnMapping } from '@/modules/mapping-templates/interfaces/mapping-template.interface';
import { FileSignature } from '@/modules/mapping-templates/interfaces/file-signature.interface';
import { MappedRow } from './interfaces/canonical-row.interface';
import { PdfAiExtractionService } from './parsers/pdf-ai-extraction.service';

@Injectable()
export class ImportsService {
    private readonly logger = new Logger(ImportsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly documentsService: DocumentsService,
        private readonly auditLogService: AuditLogService,
        private readonly positionsService: PositionsService,
        private readonly templateDetectionService: TemplateDetectionService,
        private readonly parserFactory: ParserFactory,
        private readonly columnMappingEngine: ColumnMappingEngine,
        private readonly stagedRowValidator: StagedRowValidator,
        private readonly dedupService: DedupService,
        private readonly pdfAiExtractionService: PdfAiExtractionService,
        @InjectQueue(IMPORT_PROCESSING_QUEUE) private readonly importQueue: Queue,
    ) { }

    private async assertAccountOwnership(userUuid: string, accountUuid: string) {
        const account = await this.prisma.account.findFirst({ where: { id: accountUuid, user_uuid: userUuid } });
        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    async createBatches(userUuid: string, accountUuid: string, files: Express.Multer.File[]) {
        if (!files || files.length === 0) throw new BadRequestException('At least one file is required');
        await this.assertAccountOwnership(userUuid, accountUuid);

        const batches = [];
        for (const file of files) {
            const document = await this.documentsService.createFromBuffer({
                userUuid,
                buffer: file.buffer,
                filename: file.originalname,
                contentType: file.mimetype,
                folder: GcsFolders.imports,
                category: 'STATEMENT',
                type: 'DOCUMENT',
            });

            const batch = await this.prisma.importBatch.create({
                data: {
                    user_uuid: userUuid,
                    account_uuid: accountUuid,
                    source_document_uuid: document.id,
                    status: ImportBatchStatus.UPLOADED,
                },
            });

            await this.prisma.document.update({ where: { id: document.id }, data: { import_batch_uuid: batch.id } });
            await this.importQueue.add('process', { importBatchUuid: batch.id });
            batches.push(batch);
        }

        return batches;
    }

    async findAll(userUuid: string, query: ImportBatchQueryType) {
        const where: Prisma.ImportBatchWhereInput = {
            user_uuid: userUuid,
            ...(query.account_uuid && { account_uuid: query.account_uuid }),
            ...(query.status && { status: query.status }),
        };

        const [items, count] = await Promise.all([
            this.prisma.importBatch.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { created_at: 'desc' },
                include: { source_document: true, mapping_template: true, _count: { select: { staged_transactions: true } } },
            }),
            this.prisma.importBatch.count({ where }),
        ]);

        return {
            data: items,
            pagination: {
                total: count,
                page: query.page,
                limit: query.limit,
                total_pages: Math.ceil(count / query.limit),
                has_next: query.page < Math.ceil(count / query.limit),
                has_prev: query.page > 1,
            },
        };
    }

    async findOne(userUuid: string, id: string) {
        const batch = await this.prisma.importBatch.findFirst({
            where: { id, user_uuid: userUuid },
            include: { source_document: true, mapping_template: true, _count: { select: { staged_transactions: true } } },
        });
        if (!batch) throw new NotFoundException('Import batch not found');
        return batch;
    }

    async findStaged(userUuid: string, batchId: string, query: StagedTransactionQueryType) {
        await this.findOne(userUuid, batchId);

        const where: Prisma.StagedTransactionWhereInput = {
            import_batch_uuid: batchId,
            ...(query.status && { status: query.status }),
        };

        const [items, count] = await Promise.all([
            this.prisma.stagedTransaction.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { row_index: 'asc' },
                include: { resolved_instrument: true },
            }),
            this.prisma.stagedTransaction.count({ where }),
        ]);

        return {
            data: items,
            pagination: {
                total: count,
                page: query.page,
                limit: query.limit,
                total_pages: Math.ceil(count / query.limit),
                has_next: query.page < Math.ceil(count / query.limit),
                has_prev: query.page > 1,
            },
        };
    }

    async updateStaged(userUuid: string, batchId: string, stagedId: string, dto: UpdateStagedTransactionDto) {
        await this.findOne(userUuid, batchId);

        const staged = await this.prisma.stagedTransaction.findFirst({ where: { id: stagedId, import_batch_uuid: batchId } });
        if (!staged) throw new NotFoundException('Staged transaction not found');
        if (staged.status === StagedTransactionStatus.COMMITTED) {
            throw new ConflictException('This row has already been committed');
        }

        return this.prisma.stagedTransaction.update({
            where: { id: stagedId },
            data: {
                ...(dto.mapped_data && { mapped_data: { ...(staged.mapped_data as object), ...dto.mapped_data } as Prisma.InputJsonValue }),
                ...(dto.status && { status: dto.status }),
                ...(dto.resolved_instrument_uuid && { resolved_instrument_uuid: dto.resolved_instrument_uuid }),
            },
        });
    }

    async assignMappingTemplate(userUuid: string, batchId: string, mappingTemplateUuid: string) {
        const batch = await this.findOne(userUuid, batchId);

        const template = await this.prisma.mappingTemplate.findFirst({
            where: { id: mappingTemplateUuid, OR: [{ user_uuid: userUuid }, { user_uuid: null }] },
        });
        if (!template) throw new NotFoundException('Mapping template not found');

        await this.prisma.importBatch.update({
            where: { id: batch.id },
            data: { mapping_template_uuid: mappingTemplateUuid, status: ImportBatchStatus.PROCESSING, error_summary: null },
        });

        await this.importQueue.add('process', { importBatchUuid: batch.id });
        return { queued: true };
    }

    async reparse(userUuid: string, batchId: string) {
        const batch = await this.findOne(userUuid, batchId);
        if (!batch.mapping_template_uuid) {
            throw new BadRequestException('Assign a mapping template before reparsing');
        }

        await this.prisma.stagedTransaction.deleteMany({ where: { import_batch_uuid: batchId, status: { not: StagedTransactionStatus.COMMITTED } } });
        await this.prisma.importBatch.update({ where: { id: batchId }, data: { status: ImportBatchStatus.PROCESSING, error_summary: null } });
        await this.importQueue.add('process', { importBatchUuid: batchId });
        return { queued: true };
    }

    private async stageMappedRows(batchUuid: string, accountUuid: string, userUuid: string, mappedRows: MappedRow[]) {
        const stagedRows: Prisma.StagedTransactionCreateManyInput[] = [];

        for (const mappedRow of mappedRows) {
            const validated = await this.stagedRowValidator.validate(mappedRow, userUuid);
            const duplicate = await this.dedupService.findDuplicate(accountUuid, validated);
            const validationErrors = [...validated.validation_errors];
            if (duplicate) {
                validationErrors.push({ field: 'duplicate', message: `Likely duplicate of an already-committed transaction (${duplicate.id})` });
            }

            stagedRows.push({
                import_batch_uuid: batchUuid,
                row_index: mappedRow.row_index,
                raw_data: mappedRow.raw as Prisma.InputJsonValue,
                mapped_data: validated.mapped as unknown as Prisma.InputJsonValue,
                status: StagedTransactionStatus.PENDING_REVIEW,
                validation_errors: validationErrors.length > 0 ? (validationErrors as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
                resolved_instrument_uuid: validated.resolved_instrument_uuid,
            });
        }

        return stagedRows;
    }

    /** The actual parse -> map -> validate -> dedup -> stage pipeline (DESIGN.MD §4). Runs on the import-processing queue. */
    async processBatch(batchUuid: string) {
        const batch = await this.prisma.importBatch.findUnique({
            where: { id: batchUuid },
            include: { source_document: true, mapping_template: true },
        });
        if (!batch) return;

        try {
            await this.prisma.importBatch.update({ where: { id: batchUuid }, data: { status: ImportBatchStatus.DETECTING } });

            const fileType = detectSourceFileType(batch.source_document.filename, batch.source_document.mimetype);
            const buffer = await this.documentsService.downloadBuffer(batch.source_document);

            let stagedRows: Prisma.StagedTransactionCreateManyInput[];

            if (fileType === 'PDF') {
                // No layout mapping template mechanism exists for PDFs yet — every PDF goes
                // through AI-assisted extraction (DESIGN.MD §4.4), quota-checked and cost-logged.
                const canonicalRows = await this.pdfAiExtractionService.extract(buffer, batch.user_uuid, batchUuid);
                const mappedRows: MappedRow[] = canonicalRows.map((row, index) => ({
                    row_index: index,
                    raw: row as unknown as Record<string, string | null>,
                    mapped: row,
                    mapping_errors: [],
                }));
                stagedRows = await this.stageMappedRows(batchUuid, batch.account_uuid, batch.user_uuid, mappedRows);
            } else {
                const parsedFile = await this.parserFactory.forFileType(fileType).parse(buffer);

                const fileSignature: FileSignature = {
                    sheets: parsedFile.sheets.map((s) => ({ name: s.name, header_row_index: s.header_row_index, headers: s.headers })),
                };

                let templateId = batch.mapping_template_uuid;
                let sheetNameMap: Record<string, string> | null = null;

                if (templateId) {
                    sheetNameMap = await this.templateDetectionService.matchTemplate(templateId, fileSignature);
                    if (!sheetNameMap) {
                        await this.prisma.importBatch.update({
                            where: { id: batchUuid },
                            data: {
                                status: ImportBatchStatus.NEEDS_MAPPING,
                                error_summary: 'The assigned mapping template no longer matches this file\'s sheets/columns.',
                            },
                        });
                        return;
                    }
                } else {
                    const detected = await this.templateDetectionService.detect(fileType, fileSignature, batch.user_uuid);
                    if (!detected) {
                        await this.prisma.importBatch.update({
                            where: { id: batchUuid },
                            data: {
                                status: ImportBatchStatus.NEEDS_MAPPING,
                                error_summary: `No matching mapping template found. Detected sheets: ${parsedFile.sheets.map((s) => `${s.name} [${s.headers.filter(Boolean).join(', ')}]`).join(' | ')}`,
                            },
                        });
                        return;
                    }
                    templateId = detected.template_id;
                    sheetNameMap = detected.sheet_name_map;
                    await this.prisma.importBatch.update({ where: { id: batchUuid }, data: { mapping_template_uuid: templateId } });
                }

                const template = await this.prisma.mappingTemplate.findUniqueOrThrow({ where: { id: templateId } });
                const columnMapping = template.column_mapping as unknown as ColumnMapping;

                const allMappedRows: MappedRow[] = [];
                let rowIndex = 0;

                for (const [templateSheetName, actualSheetName] of Object.entries(sheetNameMap)) {
                    const sheetMapping = columnMapping.sheets[templateSheetName];
                    const parsedSheet = parsedFile.sheets.find((s) => s.name === actualSheetName);
                    if (!sheetMapping || !parsedSheet) continue;

                    for (const mappedRow of this.columnMappingEngine.mapSheet(sheetMapping, parsedSheet)) {
                        allMappedRows.push({ ...mappedRow, row_index: rowIndex++ });
                    }
                }

                stagedRows = await this.stageMappedRows(batchUuid, batch.account_uuid, batch.user_uuid, allMappedRows);
            }

            if (stagedRows.length === 0) {
                await this.prisma.importBatch.update({
                    where: { id: batchUuid },
                    data: { status: ImportBatchStatus.FAILED, error_summary: 'No data rows were found in the recognized sheets.' },
                });
                return;
            }

            await this.prisma.$transaction([
                this.prisma.stagedTransaction.deleteMany({ where: { import_batch_uuid: batchUuid, status: { not: StagedTransactionStatus.COMMITTED } } }),
                this.prisma.stagedTransaction.createMany({ data: stagedRows }),
                this.prisma.importBatch.update({ where: { id: batchUuid }, data: { status: ImportBatchStatus.NEEDS_REVIEW } }),
            ]);
        } catch (error) {
            this.logger.error(`Import batch ${batchUuid} processing failed: ${error.message}`, error.stack);
            await this.prisma.importBatch.update({
                where: { id: batchUuid },
                data: { status: ImportBatchStatus.FAILED, error_summary: error.message?.slice(0, 1000) },
            });
        }
    }

    async commit(userUuid: string, batchId: string) {
        const batch = await this.findOne(userUuid, batchId);

        const acceptedRows = await this.prisma.stagedTransaction.findMany({
            where: { import_batch_uuid: batchId, status: StagedTransactionStatus.ACCEPTED },
        });

        if (acceptedRows.length === 0) {
            throw new BadRequestException('No accepted rows to commit — accept staged rows first');
        }

        const remainingUnresolved = await this.prisma.stagedTransaction.count({
            where: { import_batch_uuid: batchId, status: StagedTransactionStatus.PENDING_REVIEW },
        });

        const committedIds: string[] = [];

        await this.prisma.$transaction(async (tx) => {
            for (const row of acceptedRows) {
                const mapped = row.mapped_data as Record<string, unknown> as {
                    type: TransactionType;
                    trade_date: string;
                    settlement_date?: string;
                    quantity?: string;
                    price?: string;
                    amount: string;
                    fee?: string;
                    tax_withheld?: string;
                    currency: string;
                    fx_rate?: string;
                    broker_ref?: string;
                };

                const created = await tx.transaction.create({
                    data: {
                        user_uuid: batch.user_uuid,
                        account_uuid: batch.account_uuid,
                        instrument_uuid: row.resolved_instrument_uuid,
                        type: mapped.type,
                        trade_date: new Date(mapped.trade_date),
                        settlement_date: mapped.settlement_date ? new Date(mapped.settlement_date) : null,
                        quantity: mapped.quantity,
                        price: mapped.price,
                        amount: mapped.amount,
                        fee: mapped.fee ?? '0',
                        tax_withheld: mapped.tax_withheld ?? '0',
                        currency: mapped.currency,
                        fx_rate: mapped.fx_rate,
                        broker_ref: mapped.broker_ref,
                        import_batch_uuid: batchId,
                        source_staged_transaction_uuid: row.id,
                    },
                });

                await tx.stagedTransaction.update({ where: { id: row.id }, data: { status: StagedTransactionStatus.COMMITTED } });

                await this.auditLogService.record(
                    {
                        user_uuid: batch.user_uuid,
                        entity_type: 'Transaction',
                        entity_uuid: created.id,
                        action: AuditAction.COMMIT,
                        after: created as unknown as Prisma.InputJsonValue,
                    },
                    tx,
                );

                committedIds.push(created.id);
            }

            await tx.importBatch.update({
                where: { id: batchId },
                data: {
                    status: remainingUnresolved > 0 ? ImportBatchStatus.PARTIALLY_COMMITTED : ImportBatchStatus.COMMITTED,
                    committed_at: new Date(),
                },
            });
        });

        await this.positionsService.enqueueRecompute(batch.account_uuid);

        return { committed_count: committedIds.length, transaction_ids: committedIds };
    }
}
