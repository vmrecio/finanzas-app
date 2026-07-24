import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { CATEGORY_KINDS, type CategoryKind } from '../../../domain/category.entity';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(CATEGORY_KINDS)
  kind!: CategoryKind;
}
