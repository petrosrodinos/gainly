import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { InstrumentQueryType } from './dto/instrument-query.schema';
import { ResolveInstrumentParams } from './interfaces/instruments.interface';

@Injectable()
export class InstrumentsService {
    constructor(private readonly prisma: PrismaService) { }

    private visibleTo(userUuid: string): Prisma.InstrumentWhereInput {
        return { OR: [{ user_uuid: null }, { user_uuid: userUuid }] };
    }

    async create(userUuid: string, dto: CreateInstrumentDto) {
        if (dto.isin) {
            const existing = await this.prisma.instrument.findUnique({ where: { isin: dto.isin } });
            if (existing) return existing;
        }

        return this.prisma.instrument.create({
            data: { ...dto, user_uuid: userUuid, is_custom: true },
        });
    }

    /**
     * ISIN-first, then ticker+exchange, per DESIGN.MD §4. Returns null (never a guess) when
     * nothing or more than one candidate matches.
     */
    async resolve(params: ResolveInstrumentParams) {
        if (params.isin) {
            return this.prisma.instrument.findUnique({ where: { isin: params.isin } });
        }

        if (params.ticker) {
            const where: Prisma.InstrumentWhereInput = {
                ticker: params.ticker,
                ...(params.exchange && { exchange: params.exchange }),
                ...(params.userUuid && { OR: [{ user_uuid: null }, { user_uuid: params.userUuid }] }),
            };

            const candidates = await this.prisma.instrument.findMany({ where, take: 2 });
            return candidates.length === 1 ? candidates[0] : null;
        }

        return null;
    }

    async findAll(userUuid: string, query: InstrumentQueryType) {
        const where: Prisma.InstrumentWhereInput = {
            AND: [
                this.visibleTo(userUuid),
                ...(query.asset_class ? [{ asset_class: query.asset_class }] : []),
                ...(query.search
                    ? [
                        {
                            OR: [
                                { isin: { contains: query.search, mode: 'insensitive' as const } },
                                { ticker: { contains: query.search, mode: 'insensitive' as const } },
                                { name: { contains: query.search, mode: 'insensitive' as const } },
                            ],
                        },
                    ]
                    : []),
            ],
        };

        const [items, count] = await Promise.all([
            this.prisma.instrument.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.instrument.count({ where }),
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
        const instrument = await this.prisma.instrument.findFirst({
            where: { id, ...this.visibleTo(userUuid) },
        });
        if (!instrument) throw new NotFoundException('Instrument not found');
        return instrument;
    }

    async update(userUuid: string, id: string, dto: UpdateInstrumentDto) {
        const instrument = await this.findOne(userUuid, id);
        if (!instrument.is_custom || instrument.user_uuid !== userUuid) {
            throw new ForbiddenException('Only your own custom instruments can be edited');
        }
        return this.prisma.instrument.update({ where: { id }, data: dto });
    }

    async remove(userUuid: string, id: string) {
        const instrument = await this.findOne(userUuid, id);
        if (!instrument.is_custom || instrument.user_uuid !== userUuid) {
            throw new ForbiddenException('Only your own custom instruments can be deleted');
        }

        const transactionCount = await this.prisma.transaction.count({ where: { instrument_uuid: id } });
        if (transactionCount > 0) {
            throw new ConflictException('Instrument has transactions and cannot be deleted');
        }

        await this.prisma.instrument.delete({ where: { id } });
        return { success: true };
    }
}
