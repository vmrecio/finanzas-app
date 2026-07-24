import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CATEGORY_KINDS, type CategoryKind } from '../../../domain/category.entity';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsIn(CATEGORY_KINDS)
  kind?: CategoryKind;
}
