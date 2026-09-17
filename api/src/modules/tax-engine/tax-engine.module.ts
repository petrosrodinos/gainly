import { Module } from '@nestjs/common';
import { PrismaModule } from '@/core/databases/prisma/prisma.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { PositionsModule } from '@/modules/positions/positions.module';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { LtTaxRuleModule } from './jurisdictions/lt/lt-tax-rule.module';
import { TaxRuleRegistry } from './tax-rule-registry.service';
import { TaxComputationController } from './computations/tax-computation.controller';
import { TaxComputationService } from './computations/tax-computation.service';
import { TaxFormController } from './forms/tax-form.controller';
import { TaxFormService } from './forms/tax-form.service';

@Module({
    imports: [PrismaModule, AuditLogModule, PositionsModule, DocumentsModule],
    controllers: [TaxComputationController, TaxFormController],
    providers: [LtTaxRuleModule, TaxRuleRegistry, TaxComputationService, TaxFormService],
    exports: [TaxRuleRegistry, TaxComputationService],
})
export class TaxEngineModule { }
