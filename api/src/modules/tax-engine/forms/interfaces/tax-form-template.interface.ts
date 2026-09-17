export interface TaxFormFieldDefinition {
    label: string;
    /** Dot path into the TaxComputationResult JSON (e.g. "estimated_tax_liability"). */
    path: string;
}

export interface TaxFormTemplateDefinition {
    form_type: string;
    country_code: string;
    title: string;
    fields: TaxFormFieldDefinition[];
}
