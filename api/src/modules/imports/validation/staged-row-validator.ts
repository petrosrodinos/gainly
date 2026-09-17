import { Injectable } from '@nestjs/common';
import { TransactionType } from 'generated/prisma';
import { InstrumentsService } from '@/modules/instruments/instruments.service';
import { MappedRow } from '../interfaces/canonical-row.interface';

export interface ValidationIssue {
    field: string;
    message: string;
}

export interface ValidatedRow {
    row_index: number;
    mapped: MappedRow['mapped'];
    resolved_instrument_uuid: string | null;
    validation_errors: ValidationIssue[];
}

const INSTRUMENT_REQUIRED_TYPES: string[] = [
    TransactionType.BUY,
    TransactionType.SELL,
    TransactionType.DIVIDEND,
    TransactionType.CORPORATE_ACTION,
];

const VALID_TYPES = new Set(Object.values(TransactionType));

@Injectable()
export class StagedRowValidator {
    constructor(private readonly instrumentsService: InstrumentsService) { }

    async validate(row: MappedRow, userUuid: string): Promise<ValidatedRow> {
        const errors: ValidationIssue[] = row.mapping_errors.map((message) => ({ field: 'mapping', message }));
        const { mapped } = row;

        if (!mapped.type || !VALID_TYPES.has(mapped.type as TransactionType)) {
            errors.push({ field: 'type', message: 'Missing or unrecognized transaction type' });
        }
        if (!mapped.trade_date) errors.push({ field: 'trade_date', message: 'Missing or unparseable trade date' });
        if (!mapped.amount) errors.push({ field: 'amount', message: 'Missing amount' });
        if (!mapped.currency) errors.push({ field: 'currency', message: 'Missing currency' });

        let resolvedInstrumentUuid: string | null = null;
        const needsInstrument = mapped.type && INSTRUMENT_REQUIRED_TYPES.includes(mapped.type as TransactionType);

        if (mapped.instrument_hint && (mapped.instrument_hint.isin || mapped.instrument_hint.ticker)) {
            const instrument = await this.instrumentsService.resolve({
                isin: mapped.instrument_hint.isin,
                ticker: mapped.instrument_hint.ticker,
                exchange: mapped.instrument_hint.exchange,
                currency: mapped.instrument_hint.currency,
                userUuid,
            });

            if (instrument) {
                resolvedInstrumentUuid = instrument.id;
            } else if (needsInstrument) {
                errors.push({
                    field: 'instrument',
                    message: `Could not resolve instrument (isin: ${mapped.instrument_hint.isin ?? '—'}, ticker: ${mapped.instrument_hint.ticker ?? '—'})`,
                });
            }
        } else if (needsInstrument) {
            errors.push({ field: 'instrument', message: 'No instrument identifier (ISIN/ticker) found on this row' });
        }

        if ((mapped.type === TransactionType.BUY || mapped.type === TransactionType.SELL) && !mapped.quantity) {
            errors.push({ field: 'quantity', message: 'Missing quantity for a buy/sell transaction' });
        }

        return {
            row_index: row.row_index,
            mapped,
            resolved_instrument_uuid: resolvedInstrumentUuid,
            validation_errors: errors,
        };
    }
}
