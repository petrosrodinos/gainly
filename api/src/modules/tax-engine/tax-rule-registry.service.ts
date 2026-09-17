import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { CostBasisMethod } from 'generated/prisma';
import { LtTaxRuleModule } from './jurisdictions/lt/lt-tax-rule.module';
import { TaxJurisdictionRuleModule } from './interfaces/tax-jurisdiction-rule-module.interface';

@Injectable()
export class TaxRuleRegistry {
    private readonly modules: Map<string, TaxJurisdictionRuleModule>;

    constructor(
        private readonly prisma: PrismaService,
        ltModule: LtTaxRuleModule,
    ) {
        this.modules = new Map([[ltModule.countryCode, ltModule]]);
    }

    async get(countryCode: string): Promise<TaxJurisdictionRuleModule> {
        const registryRow = await this.prisma.taxJurisdictionModule.findUnique({ where: { country_code: countryCode } });
        if (!registryRow || !registryRow.is_active) {
            throw new NotFoundException(`No active tax jurisdiction module registered for country "${countryCode}"`);
        }

        const module = this.modules.get(countryCode);
        if (!module) {
            throw new NotFoundException(`Tax jurisdiction module "${countryCode}" is registered but not implemented yet`);
        }

        return module;
    }

    async assertSupportsCostBasisMethod(countryCode: string, method: CostBasisMethod) {
        const module = await this.get(countryCode);
        if (!module.supportedCostBasisMethods.includes(method)) {
            throw new BadRequestException(
                `${countryCode} does not support the ${method} cost-basis method (supported: ${module.supportedCostBasisMethods.join(', ')})`,
            );
        }
    }
}
