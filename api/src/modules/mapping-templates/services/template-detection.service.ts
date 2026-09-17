import { Injectable } from '@nestjs/common';
import { SourceFileType } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { DetectionSignature, SheetSignature } from '../interfaces/mapping-template.interface';
import { FileSignature, FileSheetSignature, TemplateDetectionMatch } from '../interfaces/file-signature.interface';

export function normalizeHeader(value: string): string {
    return String(value ?? '').trim().toLowerCase();
}

@Injectable()
export class TemplateDetectionService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * User-specific templates are checked before global ones (DESIGN.MD §4.3). Only returns a
     * result on a confident (all-sheets-matched) fit — anything less routes to NEEDS_MAPPING
     * rather than guessing (spec §10).
     */
    async detect(fileType: SourceFileType, fileSignature: FileSignature, userUuid: string): Promise<TemplateDetectionMatch | null> {
        const templates = await this.prisma.mappingTemplate.findMany({
            where: { file_type: fileType, OR: [{ user_uuid: userUuid }, { user_uuid: null }] },
            orderBy: [{ user_uuid: 'desc' }, { updated_at: 'desc' }],
        });

        for (const template of templates) {
            const signature = template.detection_signature as unknown as DetectionSignature;
            const match = this.match(signature, fileSignature);
            if (match) return { template_id: template.id, sheet_name_map: match };
        }

        return null;
    }

    /** Matches one specific template's signature against a parsed file — used when a template is explicitly assigned. */
    async matchTemplate(templateId: string, fileSignature: FileSignature): Promise<Record<string, string> | null> {
        const template = await this.prisma.mappingTemplate.findUnique({ where: { id: templateId } });
        if (!template) return null;
        return this.match(template.detection_signature as unknown as DetectionSignature, fileSignature);
    }

    match(signature: DetectionSignature, fileSignature: FileSignature): Record<string, string> | null {
        const sheetNameMap: Record<string, string> = {};

        for (const required of signature.sheets ?? []) {
            const matchedSheet = this.matchSheet(required, fileSignature.sheets);
            if (!matchedSheet) return null;
            sheetNameMap[required.sheet_name] = matchedSheet.name;
        }

        return sheetNameMap;
    }

    private matchSheet(required: SheetSignature, candidates: FileSheetSignature[]): FileSheetSignature | null {
        const requiredNamePrefix = normalizeHeader(required.sheet_name);
        const requiredHeaders = required.required_headers.map(normalizeHeader);

        const byName = candidates.filter((c) => normalizeHeader(c.name).startsWith(requiredNamePrefix));
        const pool = byName.length > 0 ? byName : candidates;

        return (
            pool.find((candidate) => {
                const headers = candidate.headers.map(normalizeHeader);
                return requiredHeaders.every((h) => headers.includes(h));
            }) ?? null
        );
    }
}
