import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from '@/core/databases/prisma/prisma.service';
import { toDecimal } from '@/shared/utils/money/money.utils';

@Injectable()
export class FxConversionService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Nearest snapshot on or before `date`. Throws rather than guessing when no rate is known
     * (spec §10 — never present a number the system isn't confident is correct).
     */
    async getRate(baseCurrency: string, quoteCurrency: string, date: Date): Promise<Prisma.Decimal> {
        if (baseCurrency === quoteCurrency) return toDecimal(1);

        const snapshot = await this.prisma.fxRateSnapshot.findFirst({
            where: { base_currency: baseCurrency, quote_currency: quoteCurrency, date: { lte: date } },
            orderBy: { date: 'desc' },
        });

        if (snapshot) return snapshot.rate;

        const inverse = await this.prisma.fxRateSnapshot.findFirst({
            where: { base_currency: quoteCurrency, quote_currency: baseCurrency, date: { lte: date } },
            orderBy: { date: 'desc' },
        });

        if (inverse) return toDecimal(1).dividedBy(inverse.rate);

        throw new NotFoundException(
            `No FX rate available for ${baseCurrency}/${quoteCurrency} on or before ${date.toISOString().slice(0, 10)}`,
        );
    }

    async convert(amount: Prisma.Decimal, fromCurrency: string, toCurrency: string, date: Date): Promise<Prisma.Decimal> {
        const rate = await this.getRate(fromCurrency, toCurrency, date);
        return amount.times(rate);
    }
}
