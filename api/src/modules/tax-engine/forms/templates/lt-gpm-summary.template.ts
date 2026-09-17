import { TaxFormTemplateDefinition } from '../interfaces/tax-form-template.interface';

/**
 * Declarative summary of a Lithuanian GPM (individual income tax) investment-income computation.
 * Not an official filing form — a plain-language summary of the numbers a filer needs, per
 * spec §6/§7 ("adding a new form/country is a template, not an engine change").
 */
export const LT_GPM_SUMMARY_TEMPLATE: TaxFormTemplateDefinition = {
    form_type: 'LT_GPM_SUMMARY',
    country_code: 'LT',
    title: 'Lithuania — GPM Investment Income Summary (estimate)',
    fields: [
        { label: 'Tax year', path: 'tax_year' },
        { label: 'Cost-basis method', path: 'cost_basis_method' },
        { label: 'Total realized gains', path: 'realized_gain_total' },
        { label: 'Total realized losses', path: 'realized_loss_total' },
        { label: 'Net realized gain', path: 'net_realized_gain' },
        { label: 'Annual exemption applied', path: 'allowances_applied' },
        { label: 'Dividend income', path: 'dividend_income_total' },
        { label: 'Interest income', path: 'interest_income_total' },
        { label: 'Foreign withholding credits available', path: 'withholding_credits_available' },
        { label: 'Loss carryforward used', path: 'loss_carryforward_used' },
        { label: 'Loss carryforward remaining', path: 'loss_carryforward_remaining' },
        { label: 'Estimated tax liability (EUR)', path: 'estimated_tax_liability' },
    ],
};
