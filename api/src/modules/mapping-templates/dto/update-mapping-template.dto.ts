import { PartialType } from '@nestjs/swagger';
import { CreateMappingTemplateDto } from './create-mapping-template.dto';

export class UpdateMappingTemplateDto extends PartialType(CreateMappingTemplateDto) { }
