import { CostBasisMethod, Prisma, TransactionType } from 'generated/prisma';
import { DisposalResult } from '@/modules/positions/interfaces/lot-matching.interface';

export interface TaxIncomeTransaction {
    id: string;
    instrument_uuid: string | null;
    type: TransactionType;
    trade_date: Date;
    amount: Prisma.Decimal;
    tax_withheld: Prisma.Decimal;
    currency: string;
}

export interface DisposalLine {
    instrument_uuid: string;
    quantity: string;
    acquired_at: string;
    disposed_at: string;
    holding_period_days: number;
    proceeds: string;
    cost_basis: string;
    gain_loss: string;
    currency: string;
}

export interface TaxComputationInput {
    taxYear: number;
    countryCode: string;
    costBasisMethod: CostBasisMethod;
    accountBaseCurrency: string;
    disposals: DisposalResult[];
    incomeTransactions: TaxIncomeTransaction[];
    priorYearCarryforwardLoss: string;
}

export interface TaxComputationResult {
    country_code: string;
    tax_year: number;
    cost_basis_method: CostBasisMethod;
    disposals: DisposalLine[];
    realized_gain_total: string;
    realized_loss_total: string;
    net_realized_gain: string;
    dividend_income_total: string;
    interest_income_total: string;
    fx_gain_loss: string;
    withholding_credits_available: string;
    allowances_applied: string;
    loss_carryforward_used: string;
    loss_carryforward_remaining: string;
    estimated_tax_liability: string;
    warnings: string[];
    is_estimate: true;
}

export interface TaxJurisdictionRuleModule {
    countryCode: string;
    version: string;
    supportedCostBasisMethods: CostBasisMethod[];
    defaultCostBasisMethod: CostBasisMethod;
    computeTaxYear(input: TaxComputationInput): TaxComputationResult;
}
