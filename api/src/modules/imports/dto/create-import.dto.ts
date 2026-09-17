import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateImportDto {
    @ApiProperty({ description: 'Account these statements belong to' })
    @IsUUID()
    account_uuid: string;
}
