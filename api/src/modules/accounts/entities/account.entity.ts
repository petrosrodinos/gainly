import { ApiProperty } from '@nestjs/swagger';

export class Account {
    @ApiProperty()
    id: string;

    @ApiProperty()
    user_uuid: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    currency: string;

    @ApiProperty()
    jurisdiction: string;

    @ApiProperty()
    created_at: Date;

    @ApiProperty()
    updated_at: Date;
}
