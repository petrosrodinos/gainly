import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { TaxComputationService } from './tax-computation.service';
import { CreateTaxComputationDto } from './dto/create-tax-computation.dto';
import { TaxComputationQuerySchema, TaxComputationQueryType } from './dto/tax-computation-query.schema';

@ApiTags('Tax Computations')
@ApiBearerAuth()
@Controller('tax/computations')
@UseGuards(JwtGuard)
export class TaxComputationController {
    constructor(private readonly taxComputationService: TaxComputationService) { }

    @Post()
    @ApiOperation({ summary: 'Create or recompute a draft tax-year computation for an account' })
    create(@CurrentUser('id') userId: string, @Body() dto: CreateTaxComputationDto) {
        return this.taxComputationService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List tax computations' })
    findAll(
        @CurrentUser('id') userId: string,
        @Query(new ZodValidationPipe(TaxComputationQuerySchema)) query: TaxComputationQueryType,
    ) {
        return this.taxComputationService.findAll(userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a tax computation' })
    findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.taxComputationService.findOne(userId, id);
    }

    @Get(':id/history')
    @ApiOperation({ summary: 'All versions of this account/country/year computation' })
    history(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.taxComputationService.history(userId, id);
    }

    @Post(':id/finalize')
    @ApiOperation({ summary: 'Finalize (lock) a draft computation' })
    finalize(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.taxComputationService.finalize(userId, id);
    }
}
