import { Injectable } from '@nestjs/common';
import { CostBasisMethod, TransactionType } from 'generated/prisma';
import { toDecimal, ZERO } from '@/shared/utils/money/money.utils';
import { DisposalLine, TaxComputationInput, TaxComputationResult, TaxJurisdictionRuleModule } from '../../interfaces/tax-jurisdiction-rule-module.interface';

const GPM_RATE = 0.15;
/** Annual exemption on net capital gains from securities sales (LT GPM law, Art. 17). */
const SECURITIES_GAIN_EXEMPTION = 500;

/**
 * MVP reference jurisdiction module (spec §5/§7: "one fully working country tax module").
 * Implements a best-effort approximation of Lithuanian GPM (individual income tax) rules for
 * investment income — flat 15% on securities gains (net of the €500/year exemption) and on
 * dividend/interest income, foreign withholding credited up to the LT liability, no loss
 * carryforward for individuals. This is NOT verified tax advice; every computation is surfaced
 * as an estimate (spec §5) and non-standard assumptions are listed in `warnings`.
 */
@Injectable()
export class LtTaxRuleModule implements TaxJurisdictionRuleModule {
    countryCode = 'LT';
    version = '2025.1';
    supportedCostBasisMethods: CostBasisMethod[] = [CostBasisMethod.FIFO, CostBasisMethod.AVERAGE_COST];
    defaultCostBasisMethod: CostBasisMethod = CostBasisMethod.FIFO;

    computeTaxYear(input: TaxComputationInput): TaxComputationResult {
        const warnings: string[] = [
            'Estimate only — Lithuanian GPM rules implemented here are a best-effort MVP approximation, not verified tax advice. Confirm with a licensed tax adviser before filing.',
        ];

        const disposalLines: DisposalLine[] = input.disposals.map((d) => ({
            instrument_uuid: d.instrument_uuid,
            quantity: d.quantity.toString(),
            acquired_at: d.acquired_at.toISOString().slice(0, 10),
            disposed_at: d.disposed_at.toISOString().slice(0, 10),
            holding_period_days: d.holding_period_days,
            proceeds: d.proceeds.toString(),
            cost_basis: d.cost_basis.toString(),
            gain_loss: d.gain_loss.toString(),
            currency: d.currency,
        }));

        const realizedGainTotal = input.disposals.reduce((acc, d) => (d.gain_loss.greaterThan(ZERO) ? acc.plus(d.gain_loss) : acc), ZERO);
        const realizedLossTotal = input.disposals.reduce((acc, d) => (d.gain_loss.lessThan(ZERO) ? acc.plus(d.gain_loss.abs()) : acc), ZERO);
        const netRealizedGain = realizedGainTotal.minus(realizedLossTotal);

        const exemption = netRealizedGain.greaterThan(ZERO) ? decimalMin(netRealizedGain, toDecimal(SECURITIES_GAIN_EXEMPTION)) : ZERO;
        const taxableGain = netRealizedGain.greaterThan(ZERO) ? netRealizedGain.minus(exemption) : ZERO;
        const securitiesGainTax = taxableGain.times(GPM_RATE);

        if (netRealizedGain.greaterThan(ZERO) && netRealizedGain.lessThanOrEqualTo(SECURITIES_GAIN_EXEMPTION)) {
            warnings.push(`Net securities gain (${netRealizedGain.toFixed(2)}) is within the €${SECURITIES_GAIN_EXEMPTION} annual exemption — no tax due on it.`);
        }

        const dividendTxs = input.incomeTransactions.filter((t) => t.type === TransactionType.DIVIDEND);
        const interestTxs = input.incomeTransactions.filter((t) => t.type === TransactionType.INTEREST);

        const dividendIncomeTotal = dividendTxs.reduce((acc, t) => acc.plus(toDecimal(t.amount)), ZERO);
        const interestIncomeTotal = interestTxs.reduce((acc, t) => acc.plus(toDecimal(t.amount)), ZERO);

        const dividendTaxDue = dividendIncomeTotal.times(GPM_RATE);
        const interestTaxDue = interestIncomeTotal.times(GPM_RATE);

        const totalWithheld = input.incomeTransactions.reduce((acc, t) => acc.plus(toDecimal(t.tax_withheld)), ZERO);
        const withholdingCredit = decimalMin(totalWithheld, dividendTaxDue.plus(interestTaxDue));

        warnings.push('FX gain/loss is reported for information only — not treated as a separate taxable event for individuals under this MVP module.');
        warnings.push('Lithuania does not allow carrying forward capital losses from securities sales for individual taxpayers — no loss carryforward is applied, regardless of prior-year losses.');
        if (interestIncomeTotal.greaterThan(ZERO)) {
            warnings.push('Interest income is taxed at the flat 15% GPM rate in this MVP module — some deposit-interest exemptions that may apply in practice are not modeled.');
        }

        const estimatedTaxLiability = securitiesGainTax.plus(dividendTaxDue).plus(interestTaxDue).minus(withholdingCredit);

        return {
            country_code: this.countryCode,
            tax_year: input.taxYear,
            cost_basis_method: input.costBasisMethod,
            disposals: disposalLines,
            realized_gain_total: realizedGainTotal.toString(),
            realized_loss_total: realizedLossTotal.toString(),
            net_realized_gain: netRealizedGain.toString(),
            dividend_income_total: dividendIncomeTotal.toString(),
            interest_income_total: interestIncomeTotal.toString(),
            fx_gain_loss: '0',
            withholding_credits_available: totalWithheld.toString(),
            allowances_applied: exemption.toString(),
            loss_carryforward_used: '0',
            loss_carryforward_remaining: '0',
            estimated_tax_liability: (estimatedTaxLiability.greaterThan(ZERO) ? estimatedTaxLiability : ZERO).toString(),
            warnings,
            is_estimate: true,
        };
    }
}

function decimalMin(a: ReturnType<typeof toDecimal>, b: ReturnType<typeof toDecimal>) {
    return a.lessThanOrEqualTo(b) ? a : b;
}
