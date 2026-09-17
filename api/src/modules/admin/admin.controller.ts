import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { Roles } from '@/shared/decorators/roles.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { AiUsageService } from '@/modules/ai-usage/ai-usage.service';
import { AiUsageQuerySchema, AiUsageQueryType, AiUsageStatsQuerySchema, AiUsageStatsQueryType } from '@/modules/ai-usage/dto/ai-usage-query.schema';
import { AdminService } from './admin.service';
import { AdminImportQuerySchema, AdminImportQueryType } from './dto/admin-import-query.schema';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly aiUsageService: AiUsageService,
    ) { }

    @Get('imports')
    @ApiOperation({ summary: 'Cross-user import triage view (failed/needs-review/needs-mapping batches)' })
    findImportsForTriage(@Query(new ZodValidationPipe(AdminImportQuerySchema)) query: AdminImportQueryType) {
        return this.adminService.findImportsForTriage(query);
    }

    @Get('mapping-templates')
    @ApiOperation({ summary: 'List all mapping templates, including per-user ones' })
    findAllMappingTemplates() {
        return this.adminService.findAllMappingTemplates();
    }

    @Post('mapping-templates/:id/promote')
    @ApiOperation({ summary: "Clone a user's mapping template into the global library" })
    promoteMappingTemplate(@Param('id') id: string) {
        return this.adminService.promoteMappingTemplate(id);
    }

    @Get('ai-usage')
    @ApiOperation({ summary: 'AI-assisted-extraction usage/cost call log, across all users (spec §8)' })
    findAiUsage(@Query(new ZodValidationPipe(AiUsageQuerySchema)) query: AiUsageQueryType) {
        return this.aiUsageService.findAll(query);
    }

    @Get('ai-usage/stats')
    @ApiOperation({ summary: 'AI-assisted-extraction cost summary (total/avg cost, cost by feature)' })
    aiUsageStats(@Query(new ZodValidationPipe(AiUsageStatsQuerySchema)) query: AiUsageStatsQueryType) {
        return this.aiUsageService.getStats(query);
    }
}
