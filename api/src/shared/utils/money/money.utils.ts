import { Prisma } from 'generated/prisma';

const { Decimal } = Prisma;

export type DecimalInput = Prisma.Decimal | string | number | null | undefined;

export const ZERO = new Decimal(0);

export function toDecimal(value: DecimalInput, fallback: Prisma.Decimal = ZERO): Prisma.Decimal {
    if (value === null || value === undefined || value === '') return fallback;
    return value instanceof Decimal ? value : new Decimal(value);
}

/**
 * Parses broker-formatted amount+currency strings such as "2.38EUR" or "-1.35000000USD"
 * (seen in report-2025.xlsx's fee/tax columns) into a Decimal amount and ISO currency code.
 */
export function parseBrokerAmountCurrency(raw: string | null | undefined): { amount: Prisma.Decimal; currency: string | null } {
    if (!raw) return { amount: ZERO, currency: null };

    const match = String(raw).trim().match(/^(-?\d+(?:\.\d+)?)\s*([A-Za-z]{3})$/);
    if (!match) {
        throw new Error(`Unrecognized broker amount/currency format: "${raw}"`);
    }

    const [, amount, currency] = match;
    return { amount: new Decimal(amount), currency: currency.toUpperCase() };
}

export function sum(values: DecimalInput[]): Prisma.Decimal {
    return values.reduce<Prisma.Decimal>((acc, v) => acc.plus(toDecimal(v)), ZERO);
}

export function isZero(value: DecimalInput): boolean {
    return toDecimal(value).isZero();
}

export function isNegative(value: DecimalInput): boolean {
    return toDecimal(value).isNegative();
}

export function round(value: DecimalInput, decimalPlaces = 2): Prisma.Decimal {
    return toDecimal(value).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP);
}

export function toNumber(value: DecimalInput): number {
    return toDecimal(value).toNumber();
}
