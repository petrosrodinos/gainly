import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthRole, CorporateActionType, Prisma } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { PositionsService } from '../positions/positions.service';
import { CreateCorporateActionDto } from './dto/create-corporate-action.dto';
import { UpdateCorporateActionDto } from './dto/update-corporate-action.dto';
import { CorporateActionQueryType } from './dto/corporate-action-query.schema';

const RATIO_REQUIRED_TYPES: CorporateActionType[] = [CorporateActionType.SPLIT, CorporateActionType.REVERSE_SPLIT];
const NO_AUTO_ADJUSTMENT_TYPES: CorporateActionType[] = [CorporateActionType.MERGER, CorporateActionType.SPINOFF, CorporateActionType.OTHER];

@Injectable()
export class CorporateActionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly positionsService: PositionsService,
    ) { }

    private isAdmin(role: AuthRole) {
        return role === 'ADMIN' || role === 'SUPER_ADMIN';
    }

    private async assertCanManage(userId: string, role: AuthRole, instrumentUuid: string) {
        const instrument = await this.prisma.instrument.findUnique({ where: { id: instrumentUuid } });
        if (!instrument) throw new NotFoundException('Instrument not found');

        if (this.isAdmin(role)) return instrument;
        if (instrument.is_custom && instrument.user_uuid === userId) return instrument;

        throw new ForbiddenException('Only an admin, or the owner of a custom instrument, can manage its corporate actions');
    }

    private async recomputeAffectedAccounts(instrumentUuid: string) {
        const accounts = await this.prisma.transaction.findMany({
            where: { instrument_uuid: instrumentUuid },
            select: { account_uuid: true },
            distinct: ['account_uuid'],
        });

        await Promise.all(accounts.map((a) => this.positionsService.enqueueRecompute(a.account_uuid)));
    }

    async create(userId: string, role: AuthRole, dto: CreateCorporateActionDto) {
        await this.assertCanManage(userId, role, dto.instrument_uuid);

        if (RATIO_REQUIRED_TYPES.includes(dto.type) && !dto.ratio) {
            throw new BadRequestException(`ratio is required for ${dto.type}`);
        }
        if (NO_AUTO_ADJUSTMENT_TYPES.includes(dto.type)) {
            // Recorded for provenance/display only — no automatic lot/quantity adjustment is
            // applied for these types; a manual correcting transaction may be required.
        }

        const created = await this.prisma.corporateAction.create({
            data: {
                instrument_uuid: dto.instrument_uuid,
                type: dto.type,
                effective_date: new Date(dto.effective_date),
                ratio: dto.ratio,
                details: (dto.details as Prisma.InputJsonValue) ?? undefined,
            },
        });

        await this.recomputeAffectedAccounts(dto.instrument_uuid);
        return created;
    }

    async findAll(query: CorporateActionQueryType) {
        return this.prisma.corporateAction.findMany({
            where: { instrument_uuid: query.instrument_uuid },
            orderBy: { effective_date: 'desc' },
        });
    }

    async findOne(id: string) {
        const action = await this.prisma.corporateAction.findUnique({ where: { id } });
        if (!action) throw new NotFoundException('Corporate action not found');
        return action;
    }

    async update(userId: string, role: AuthRole, id: string, dto: UpdateCorporateActionDto) {
        const action = await this.findOne(id);
        await this.assertCanManage(userId, role, action.instrument_uuid);

        const updated = await this.prisma.corporateAction.update({
            where: { id },
            data: {
                ...(dto.type && { type: dto.type }),
                ...(dto.effective_date && { effective_date: new Date(dto.effective_date) }),
                ...(dto.ratio !== undefined && { ratio: dto.ratio }),
                ...(dto.details !== undefined && { details: dto.details as Prisma.InputJsonValue }),
            },
        });

        await this.recomputeAffectedAccounts(action.instrument_uuid);
        return updated;
    }

    async remove(userId: string, role: AuthRole, id: string) {
        const action = await this.findOne(id);
        await this.assertCanManage(userId, role, action.instrument_uuid);

        await this.prisma.corporateAction.delete({ where: { id } });
        await this.recomputeAffectedAccounts(action.instrument_uuid);
        return { success: true };
    }
}
