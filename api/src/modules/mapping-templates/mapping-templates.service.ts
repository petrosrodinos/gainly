import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthRole, Prisma } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { CreateMappingTemplateDto } from './dto/create-mapping-template.dto';
import { UpdateMappingTemplateDto } from './dto/update-mapping-template.dto';
import { MappingTemplateQueryType } from './dto/mapping-template-query.schema';

function isAdmin(role: AuthRole) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

@Injectable()
export class MappingTemplatesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, role: AuthRole, dto: CreateMappingTemplateDto) {
        if (dto.is_global && !isAdmin(role)) {
            throw new ForbiddenException('Only admins can create global mapping templates');
        }

        return this.prisma.mappingTemplate.create({
            data: {
                user_uuid: dto.is_global ? null : userId,
                name: dto.name,
                file_type: dto.file_type,
                detection_signature: dto.detection_signature as unknown as Prisma.InputJsonValue,
                column_mapping: dto.column_mapping as unknown as Prisma.InputJsonValue,
            },
        });
    }

    async findAll(userId: string, query: MappingTemplateQueryType) {
        const where: Prisma.MappingTemplateWhereInput = {
            OR: [{ user_uuid: userId }, { user_uuid: null }],
            ...(query.file_type && { file_type: query.file_type }),
        };

        const [items, count] = await Promise.all([
            this.prisma.mappingTemplate.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { updated_at: 'desc' },
            }),
            this.prisma.mappingTemplate.count({ where }),
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

    async findOne(userId: string, id: string) {
        const template = await this.prisma.mappingTemplate.findFirst({
            where: { id, OR: [{ user_uuid: userId }, { user_uuid: null }] },
        });
        if (!template) throw new NotFoundException('Mapping template not found');
        return template;
    }

    private assertCanManage(userId: string, role: AuthRole, template: { user_uuid: string | null }) {
        if (template.user_uuid === null && !isAdmin(role)) {
            throw new ForbiddenException('Only admins can modify global mapping templates');
        }
        if (template.user_uuid !== null && template.user_uuid !== userId) {
            throw new ForbiddenException('You do not own this mapping template');
        }
    }

    async update(userId: string, role: AuthRole, id: string, dto: UpdateMappingTemplateDto) {
        const template = await this.findOne(userId, id);
        this.assertCanManage(userId, role, template);

        return this.prisma.mappingTemplate.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.file_type && { file_type: dto.file_type }),
                ...(dto.detection_signature && { detection_signature: dto.detection_signature as unknown as Prisma.InputJsonValue }),
                ...(dto.column_mapping && { column_mapping: dto.column_mapping as unknown as Prisma.InputJsonValue }),
                version: { increment: 1 },
            },
        });
    }

    async remove(userId: string, role: AuthRole, id: string) {
        const template = await this.findOne(userId, id);
        this.assertCanManage(userId, role, template);

        await this.prisma.mappingTemplate.delete({ where: { id } });
        return { success: true };
    }

    async promoteToGlobal(id: string) {
        const template = await this.prisma.mappingTemplate.findUnique({ where: { id } });
        if (!template) throw new NotFoundException('Mapping template not found');

        return this.prisma.mappingTemplate.create({
            data: {
                user_uuid: null,
                name: template.name,
                file_type: template.file_type,
                detection_signature: template.detection_signature as Prisma.InputJsonValue,
                column_mapping: template.column_mapping as Prisma.InputJsonValue,
            },
        });
    }
}
