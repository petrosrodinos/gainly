import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { AuthRole } from 'generated/prisma';
import { MappingTemplatesService } from './mapping-templates.service';
import { CreateMappingTemplateDto } from './dto/create-mapping-template.dto';
import { UpdateMappingTemplateDto } from './dto/update-mapping-template.dto';
import { MappingTemplateQuerySchema, MappingTemplateQueryType } from './dto/mapping-template-query.schema';

@ApiTags('Mapping Templates')
@ApiBearerAuth()
@Controller('mapping-templates')
@UseGuards(JwtGuard)
export class MappingTemplatesController {
    constructor(private readonly mappingTemplatesService: MappingTemplatesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a reusable statement mapping template' })
    create(@CurrentUser('id') userId: string, @CurrentUser('role') role: AuthRole, @Body() dto: CreateMappingTemplateDto) {
        return this.mappingTemplatesService.create(userId, role, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List mapping templates (your own + global)' })
    findAll(
        @CurrentUser('id') userId: string,
        @Query(new ZodValidationPipe(MappingTemplateQuerySchema)) query: MappingTemplateQueryType,
    ) {
        return this.mappingTemplatesService.findAll(userId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a mapping template' })
    findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.mappingTemplatesService.findOne(userId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a mapping template you own (or a global one, as admin)' })
    update(
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: AuthRole,
        @Param('id') id: string,
        @Body() dto: UpdateMappingTemplateDto,
    ) {
        return this.mappingTemplatesService.update(userId, role, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a mapping template you own (or a global one, as admin)' })
    remove(@CurrentUser('id') userId: string, @CurrentUser('role') role: AuthRole, @Param('id') id: string) {
        return this.mappingTemplatesService.remove(userId, role, id);
    }
}
