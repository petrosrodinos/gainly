import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountQueryType } from './dto/account-query.schema';

@Injectable()
export class AccountsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userUuid: string, dto: CreateAccountDto) {
        return this.prisma.account.create({
            data: { ...dto, user_uuid: userUuid },
        });
    }

    async findAll(userUuid: string, query: AccountQueryType) {
        const where = {
            user_uuid: userUuid,
            ...(query.search && { name: { contains: query.search, mode: 'insensitive' as const } }),
        };

        const [items, count] = await Promise.all([
            this.prisma.account.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { [query.order_by]: query.order_direction },
            }),
            this.prisma.account.count({ where }),
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
        const account = await this.prisma.account.findFirst({ where: { id, user_uuid: userUuid } });
        if (!account) throw new NotFoundException('Account not found');
        return account;
    }

    async update(userUuid: string, id: string, dto: UpdateAccountDto) {
        await this.findOne(userUuid, id);
        return this.prisma.account.update({ where: { id }, data: dto });
    }

    async remove(userUuid: string, id: string) {
        await this.findOne(userUuid, id);

        const transactionCount = await this.prisma.transaction.count({ where: { account_uuid: id } });
        if (transactionCount > 0) {
            throw new ConflictException('Account has transactions and cannot be deleted');
        }

        await this.prisma.account.delete({ where: { id } });
        return { success: true };
    }
}
