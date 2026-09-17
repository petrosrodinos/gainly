import { BadRequestException, Injectable } from '@nestjs/common';
import { TaxFormFormat } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { DocumentsService } from '@/modules/documents/documents.service';
import { GcsFolders } from '@/integrations/storage/gcs/config/gcs-folders.config';
import { toCsv } from '@/shared/utils/csv/csv.utils';
import { renderKeyValuePdf } from '@/shared/utils/pdf/pdf.utils';
import { TaxComputationService } from '../computations/tax-computation.service';
import { TaxComputationResult } from '../interfaces/tax-jurisdiction-rule-module.interface';
import { TaxFormTemplateDefinition } from './interfaces/tax-form-template.interface';
import { LT_GPM_SUMMARY_TEMPLATE } from './templates/lt-gpm-summary.template';
import { GenerateTaxFormDto } from './dto/generate-tax-form.dto';

const TEMPLATES: TaxFormTemplateDefinition[] = [LT_GPM_SUMMARY_TEMPLATE];

function getPath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

@Injectable()
export class TaxFormService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly taxComputationService: TaxComputationService,
        private readonly documentsService: DocumentsService,
    ) { }

    async generate(userUuid: string, computationId: string, dto: GenerateTaxFormDto) {
        const computation = await this.taxComputationService.findOne(userUuid, computationId);
        const result = computation.result as unknown as TaxComputationResult;

        const template = TEMPLATES.find((t) => t.form_type === dto.form_type && t.country_code === computation.country_code);
        if (!template) {
            throw new BadRequestException(`No form template "${dto.form_type}" registered for country ${computation.country_code}`);
        }

        const rows: [string, string][] = template.fields.map((field) => [field.label, String(getPath(result, field.path) ?? '')]);
        const filename = `${template.form_type.toLowerCase()}-${computation.tax_year}.${dto.format.toLowerCase()}`;

        let buffer: Buffer;
        let contentType: string;

        if (dto.format === TaxFormFormat.PDF) {
            buffer = await renderKeyValuePdf(template.title, `Generated ${new Date().toISOString().slice(0, 10)} — estimate, not a filed return`, rows);
            contentType = 'application/pdf';
        } else if (dto.format === TaxFormFormat.CSV) {
            buffer = Buffer.from(toCsv(['field', 'value'], rows), 'utf-8');
            contentType = 'text/csv';
        } else {
            buffer = Buffer.from(JSON.stringify({ template: template.form_type, generated_at: new Date().toISOString(), fields: rows, result }, null, 2), 'utf-8');
            contentType = 'application/json';
        }

        const document = await this.documentsService.createFromBuffer({
            userUuid,
            buffer,
            filename,
            contentType,
            folder: GcsFolders['tax-forms'],
            type: 'DOCUMENT',
            category: 'TAX_FORM',
        });

        return this.prisma.taxForm.create({
            data: {
                tax_year_computation_uuid: computation.id,
                form_type: dto.form_type,
                document_uuid: document.id,
                format: dto.format,
            },
        });
    }

    async findAll(userUuid: string, computationId: string) {
        await this.taxComputationService.findOne(userUuid, computationId);
        return this.prisma.taxForm.findMany({ where: { tax_year_computation_uuid: computationId }, include: { document: true } });
    }
}
