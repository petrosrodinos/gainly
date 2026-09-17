import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '@/shared/guards/jwt.guard';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/shared/pipes/zod.validation.pipe';
import { AuditLogService } from './audit-log.service';
import { AuditLogQuerySchema, AuditLogQueryType } from './dto/audit-log-query.schema';
import { AuthRole } from 'generated/prisma';

@ApiTags('Audit Log')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtGuard)
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get()
    @ApiOperation({ summary: 'List audit log entries (self-scoped, admins see all)' })
    findAll(
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: AuthRole,
        @Query(new ZodValidationPipe(AuditLogQuerySchema)) query: AuditLogQueryType,
    ) {
        const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
        return this.auditLogService.findAll(query, isAdmin ? undefined : userId);
    }
}
