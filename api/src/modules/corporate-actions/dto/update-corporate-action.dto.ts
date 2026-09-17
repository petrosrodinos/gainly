import { PartialType } from '@nestjs/swagger';
import { CreateCorporateActionDto } from './create-corporate-action.dto';

export class UpdateCorporateActionDto extends PartialType(CreateCorporateActionDto) { }
