import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { RealizedGainsReportDto } from './dto/realized-gains-report.dto';
import { PortfolioReportDto } from './dto/portfolio-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post('accounts/:accountUuid/transactions-csv')
    @ApiOperation({ summary: 'Generate a full transaction ledger CSV export' })
    transactionsCsv(@CurrentUser('id') userId: string, @Param('accountUuid') accountUuid: string) {
        return this.reportsService.transactionsCsv(userId, accountUuid);
    }

    @Post('accounts/:accountUuid/realized-gains-csv')
    @ApiOperation({ summary: 'Generate a realized gains/losses schedule CSV for a tax year' })
    realizedGainsCsv(
        @CurrentUser('id') userId: string,
        @Param('accountUuid') accountUuid: string,
        @Body() dto: RealizedGainsReportDto,
    ) {
        return this.reportsService.realizedGainsCsv(userId, accountUuid, dto);
    }

    @Post('accounts/:accountUuid/portfolio')
    @ApiOperation({ summary: 'Generate a PDF portfolio report (holdings, allocation)' })
    portfolioReport(
        @CurrentUser('id') userId: string,
        @Param('accountUuid') accountUuid: string,
        @Body() dto: PortfolioReportDto,
    ) {
        return this.reportsService.portfolioReport(userId, accountUuid, dto);
    }

    @Post('export')
    @ApiOperation({ summary: 'Generate a full self-service data export/backup archive' })
    fullExport(@CurrentUser('id') userId: string) {
        return this.reportsService.fullExport(userId);
    }
}
