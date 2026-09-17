import { CorporateActionType, CostBasisMethod, Prisma, TransactionType } from 'generated/prisma';

export interface ReplayTransaction {
    id: string;
    instrument_uuid: string;
    type: TransactionType;
    trade_date: Date;
    quantity: Prisma.Decimal | null;
    amount: Prisma.Decimal;
    fee: Prisma.Decimal;
    currency: string;
}

export interface ReplayCorporateAction {
    instrument_uuid: string;
    type: CorporateActionType;
    effective_date: Date;
    ratio: Prisma.Decimal | null;
}

export interface OpenLotResult {
    instrument_uuid: string;
    open_transaction_uuid: string;
    quantity_remaining: Prisma.Decimal;
    cost_basis_per_unit: Prisma.Decimal;
    opened_at: Date;
}

export interface DisposalResult {
    instrument_uuid: string;
    close_transaction_uuid: string;
    open_transaction_uuid: string | null;
    quantity: Prisma.Decimal;
    proceeds: Prisma.Decimal;
    cost_basis: Prisma.Decimal;
    gain_loss: Prisma.Decimal;
    currency: string;
    acquired_at: Date;
    disposed_at: Date;
    holding_period_days: number;
}

export interface ReplayResult {
    openLots: OpenLotResult[];
    disposals: DisposalResult[];
    warnings: string[];
}
