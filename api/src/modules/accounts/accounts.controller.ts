import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountQuerySchema, AccountQueryType } from './dto/account-query.schema';
import { Account } from './entities/account.entity';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller('accounts')
@UseGuards(JwtGuard)
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Post()
    @ApiOperation({ summary: 'Create an account (portfolio)' })
    @ApiResponse({ status: 201, type: Account })
    create(@CurrentUser('id') userId: string, @Body() dto: CreateAccountDto) {
        return this.accountsService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List accounts' })
    findAll(
        @CurrentUser('id') userId: string,
        @Query(new ZodValidationPipe(AccountQuerySchema)) query: AccountQueryType,
    ) {
        return this.accountsService.findAll(userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an account' })
    @ApiResponse({ status: 200, type: Account })
    findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.accountsService.findOne(userId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an account' })
    @ApiResponse({ status: 200, type: Account })
    update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
        return this.accountsService.update(userId, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an account (only if it has no transactions)' })
    remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.accountsService.remove(userId, id);
    }
}
