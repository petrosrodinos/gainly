import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CorrectTransactionDto } from './dto/correct-transaction.dto';
import { TransactionQuerySchema, TransactionQueryType } from './dto/transaction-query.schema';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    @ApiOperation({ summary: 'Manually add a transaction to the ledger' })
    create(@CurrentUser('id') userId: string, @Body() dto: CreateTransactionDto) {
        return this.transactionsService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List transactions (immutable ledger)' })
    findAll(
        @CurrentUser('id') userId: string,
        @Query(new ZodValidationPipe(TransactionQuerySchema)) query: TransactionQueryType,
    ) {
        return this.transactionsService.findAll(userId, query);
    }

    @Get('accounts/:accountUuid/income/:year')
    @ApiOperation({ summary: 'Dividend/interest income totals for an account and year' })
    incomeByYear(
        @CurrentUser('id') userId: string,
        @Param('accountUuid') accountUuid: string,
        @Param('year') year: string,
    ) {
        return this.transactionsService.incomeByYear(userId, accountUuid, parseInt(year, 10));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a transaction' })
    findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.transactionsService.findOne(userId, id);
    }

    @Post(':id/correct')
    @ApiOperation({ summary: 'Correct a committed transaction (creates a new linked transaction, never edits history)' })
    correct(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: CorrectTransactionDto) {
        return this.transactionsService.correct(userId, id, dto);
    }
}
