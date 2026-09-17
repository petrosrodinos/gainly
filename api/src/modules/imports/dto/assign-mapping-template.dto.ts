import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignMappingTemplateDto {
    @ApiProperty()
    @IsUUID()
    mapping_template_uuid: string;
}
