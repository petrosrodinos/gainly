import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { ColumnRule, SheetMapping } from '@/modules/mapping-templates/interfaces/mapping-template.interface';
import { normalizeHeader } from '@/modules/mapping-templates/services/template-detection.service';
import { parseBrokerAmountCurrency } from '@/shared/utils/money/money.utils';
import { ParsedSheet } from '../parsers/parser-strategy.interface';
import { CanonicalRow, MappedRow } from '../interfaces/canonical-row.interface';

const FALLBACK_DATE_FORMATS = ['yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy'];

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
    const parts = path.split('.');
    let cursor: Record<string, unknown> = target;
    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (typeof cursor[key] !== 'object' || cursor[key] === null) cursor[key] = {};
        cursor = cursor[key] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]] = value;
}

@Injectable()
export class ColumnMappingEngine {
    mapSheet(sheetMapping: SheetMapping, parsedSheet: ParsedSheet): MappedRow[] {
        return parsedSheet.rows.map((raw, index) => {
            const mapped: CanonicalRow = {};
            const errors: string[] = [];

            if (sheetMapping.default_type) mapped.type = sheetMapping.default_type;

            for (const [header, rule] of Object.entries(sheetMapping.columns)) {
                const rawValue = raw[normalizeHeader(header)];
                const result = this.applyTransform(rawValue, rule);
                if (result.error) {
                    errors.push(`${header}: ${result.error}`);
                    continue;
                }
                if (result.value !== null && result.value !== undefined) {
                    setPath(mapped as Record<string, unknown>, rule.field, result.value);
                }
            }

            return { row_index: index, raw, mapped, mapping_errors: errors };
        });
    }

    private applyTransform(rawValue: string | null, rule: ColumnRule): { value: unknown; error?: string } {
        if (rawValue === null || rawValue === undefined || rawValue.trim() === '') {
            return { value: null };
        }
        const trimmed = rawValue.trim();

        switch (rule.transform) {
            case 'trim':
                return { value: trimmed };

            case 'decimal': {
                const numeric = trimmed.replace(/,/g, '');
                if (!/^-?\d+(\.\d+)?$/.test(numeric)) return { value: null, error: `unparseable decimal "${rawValue}"` };
                const signed = rule.negate ? String(-parseFloat(numeric)) : numeric;
                return { value: signed };
            }

            case 'broker-amount-currency': {
                try {
                    const { amount } = parseBrokerAmountCurrency(trimmed);
                    const signed = rule.negate ? amount.negated() : amount;
                    return { value: signed.toString() };
                } catch {
                    return { value: null, error: `unparseable amount/currency "${rawValue}"` };
                }
            }

            case 'sign': {
                const numeric = trimmed.replace(/,/g, '');
                if (!/^-?\d+(\.\d+)?$/.test(numeric)) return { value: null, error: `unparseable number "${rawValue}"` };
                return { value: rule.negate ? String(-parseFloat(numeric)) : numeric };
            }

            case 'enum-map': {
                const key = Object.keys(rule.enum_map ?? {}).find((k) => normalizeHeader(k) === normalizeHeader(trimmed));
                if (!key) return { value: null, error: `unmapped value "${rawValue}"` };
                return { value: rule.enum_map[key] };
            }

            case 'date':
            default: {
                if (rule.transform !== 'date') return { value: trimmed };

                const isoAttempt = DateTime.fromISO(trimmed);
                if (isoAttempt.isValid) return { value: isoAttempt.toISODate() };

                const formats = rule.date_format ? [rule.date_format, ...FALLBACK_DATE_FORMATS] : FALLBACK_DATE_FORMATS;
                for (const format of formats) {
                    const attempt = DateTime.fromFormat(trimmed, format);
                    if (attempt.isValid) return { value: attempt.toISODate() };
                }

                return { value: null, error: `ambiguous/unparseable date "${rawValue}"` };
            }
        }
    }
}
