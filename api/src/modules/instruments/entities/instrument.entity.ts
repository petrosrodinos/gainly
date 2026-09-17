import { ApiProperty } from '@nestjs/swagger';
import { AssetClass } from 'generated/prisma';

export class Instrument {
    @ApiProperty()
    id: string;

    @ApiProperty({ required: false, nullable: true })
    isin?: string | null;

    @ApiProperty({ required: false, nullable: true })
    ticker?: string | null;

    @ApiProperty({ required: false, nullable: true })
    name?: string | null;

    @ApiProperty({ enum: AssetClass })
    asset_class: AssetClass;

    @ApiProperty()
    currency: string;

    @ApiProperty({ required: false, nullable: true })
    exchange?: string | null;

    @ApiProperty()
    is_custom: boolean;
}
