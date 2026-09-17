import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { TaxFormService } from './tax-form.service';
import { GenerateTaxFormDto } from './dto/generate-tax-form.dto';

@ApiTags('Tax Forms')
@ApiBearerAuth()
@Controller('tax/computations/:computationId/forms')
@UseGuards(JwtGuard)
export class TaxFormController {
    constructor(private readonly taxFormService: TaxFormService) { }

    @Post()
    @ApiOperation({ summary: 'Generate a filing-support form/export from a tax computation' })
    generate(
        @CurrentUser('id') userId: string,
        @Param('computationId') computationId: string,
        @Body() dto: GenerateTaxFormDto,
    ) {
        return this.taxFormService.generate(userId, computationId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List generated forms for a tax computation' })
    findAll(@CurrentUser('id') userId: string, @Param('computationId') computationId: string) {
        return this.taxFormService.findAll(userId, computationId);
    }
}
