import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { AuthRole } from 'generated/prisma';
import { CorporateActionsService } from './corporate-actions.service';
import { CreateCorporateActionDto } from './dto/create-corporate-action.dto';
import { UpdateCorporateActionDto } from './dto/update-corporate-action.dto';
import { CorporateActionQuerySchema, CorporateActionQueryType } from './dto/corporate-action-query.schema';

@ApiTags('Corporate Actions')
@ApiBearerAuth()
@Controller('corporate-actions')
@UseGuards(JwtGuard)
export class CorporateActionsController {
    constructor(private readonly corporateActionsService: CorporateActionsService) { }

    @Post()
    @ApiOperation({ summary: 'Record a corporate action (split, merger, spin-off, ...)' })
    create(@CurrentUser('id') userId: string, @CurrentUser('role') role: AuthRole, @Body() dto: CreateCorporateActionDto) {
        return this.corporateActionsService.create(userId, role, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List corporate actions for an instrument' })
    findAll(@Query(new ZodValidationPipe(CorporateActionQuerySchema)) query: CorporateActionQueryType) {
        return this.corporateActionsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a corporate action' })
    findOne(@Param('id') id: string) {
        return this.corporateActionsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a corporate action' })
    update(
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: AuthRole,
        @Param('id') id: string,
        @Body() dto: UpdateCorporateActionDto,
    ) {
        return this.corporateActionsService.update(userId, role, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a corporate action' })
    remove(@CurrentUser('id') userId: string, @CurrentUser('role') role: AuthRole, @Param('id') id: string) {
        return this.corporateActionsService.remove(userId, role, id);
    }
}
