import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { AccountsService } from '../accounts/accounts.service';
import { PositionsService } from './positions.service';
import { PositionSnapshotQuerySchema, PositionSnapshotQueryType } from './dto/snapshot-query.schema';

@ApiTags('Positions')
@ApiBearerAuth()
@Controller('positions/accounts/:accountUuid')
@UseGuards(JwtGuard)
export class PositionsController {
    constructor(
        private readonly positionsService: PositionsService,
        private readonly accountsService: AccountsService,
    ) { }

    @Get('holdings')
    @ApiOperation({ summary: 'Current holdings for an account, with allocation breakdown' })
    async holdings(@CurrentUser('id') userId: string, @Param('accountUuid') accountUuid: string) {
        await this.accountsService.findOne(userId, accountUuid);
        return this.positionsService.getHoldings(accountUuid);
    }

    @Get('snapshots')
    @ApiOperation({ summary: 'Historical position snapshots for an account' })
    async snapshots(
        @CurrentUser('id') userId: string,
        @Param('accountUuid') accountUuid: string,
        @Query(new ZodValidationPipe(PositionSnapshotQuerySchema)) query: PositionSnapshotQueryType,
    ) {
        await this.accountsService.findOne(userId, accountUuid);
        return this.positionsService.getSnapshotHistory(accountUuid, query);
    }

    @Post('recompute')
    @ApiOperation({ summary: 'Recompute holdings/lots for an account from its transaction ledger' })
    async recompute(@CurrentUser('id') userId: string, @Param('accountUuid') accountUuid: string) {
        await this.accountsService.findOne(userId, accountUuid);
        return this.positionsService.recomputeForAccount(accountUuid);
    }
}
