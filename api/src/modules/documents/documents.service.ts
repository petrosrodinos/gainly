import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { GcsService } from '@/integrations/storage/gcs/services/gcs.service';
import { GcsFolders } from '@/integrations/storage/gcs/config/gcs-folders.config';
import { DocumentQueryType } from './dto/document-query.schema';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { CreateDocumentFromBufferParams } from './interfaces/documents.interface';
import { splitGcsPath } from './utils/gcs-path.utils';

@Injectable()
export class DocumentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly gcsService: GcsService,
    ) { }

    async createFromBuffer(params: CreateDocumentFromBufferParams) {
        const upload = await this.gcsService.uploadImageFromBuffer(
            params.buffer,
            params.filename,
            params.contentType,
            params.folder,
        );

        return this.prisma.document.create({
            data: {
                user_uuid: params.userUuid,
                filename: params.filename,
                mimetype: params.contentType,
                size: upload.size,
                url: upload.url,
                path: upload.path,
                type: params.type,
                category: params.category,
                import_batch_uuid: params.import_batch_uuid ?? null,
            },
        });
    }

    async upload(userUuid: string, file: Express.Multer.File, dto: UploadDocumentDto) {
        if (!file) throw new ConflictException('No file provided');

        return this.createFromBuffer({
            userUuid,
            buffer: file.buffer,
            filename: file.originalname,
            contentType: file.mimetype,
            folder: GcsFolders.documents,
            type: dto.type,
            category: dto.category,
            import_batch_uuid: dto.import_batch_uuid,
        });
    }

    async findAll(userUuid: string, query: DocumentQueryType) {
        const where = {
            user_uuid: userUuid,
            ...(query.category && { category: query.category }),
            ...(query.type && { type: query.type }),
            ...(query.import_batch_uuid && { import_batch_uuid: query.import_batch_uuid }),
        };

        const [items, count] = await Promise.all([
            this.prisma.document.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.document.count({ where }),
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

    async downloadBuffer(document: { path: string }) {
        const { folder, filename } = splitGcsPath(document.path);
        const { buffer } = await this.gcsService.downloadImage({ filename, folder });
        return buffer;
    }

    async findOne(userUuid: string, id: string) {
        const document = await this.prisma.document.findFirst({ where: { id, user_uuid: userUuid } });
        if (!document) throw new NotFoundException('Document not found');

        const { folder, filename } = splitGcsPath(document.path);
        const signed_url = await this.gcsService.getSignedUrl(filename, folder);

        return { ...document, signed_url };
    }

    async remove(userUuid: string, id: string) {
        const document = await this.prisma.document.findFirst({
            where: { id, user_uuid: userUuid },
            include: { _count: { select: { source_for_import_batches: true, tax_forms: true } } },
        });
        if (!document) throw new NotFoundException('Document not found');

        if (document._count.source_for_import_batches > 0 || document._count.tax_forms > 0) {
            throw new ConflictException('Document is referenced by an import batch or tax form and cannot be deleted');
        }

        await this.gcsService.deleteImage({ filename: document.path });
        await this.prisma.document.delete({ where: { id } });

        return { success: true };
    }
}
