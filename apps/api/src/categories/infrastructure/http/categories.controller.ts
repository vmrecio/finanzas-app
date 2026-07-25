import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CategoryAlreadyExistsError,
  CategoryHasBudgetsError,
  CategoryHasTransactionsError,
  CategoryNotFoundError,
} from '../../domain/errors';
// NOTE: the use case and DTO classes below MUST stay as value imports (not
// `import type`), even though this file only uses them as parameter types.
// NestJS's constructor DI and ValidationPipe both rely on `emitDecoratorMetadata`
// capturing the real class reference at runtime; `import type` erases the
// import entirely, which breaks DI resolution and silently disables DTO
// validation (metatype degrades to `Object`).
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { CreateCategoryUseCase } from '../../application/create-category.use-case';
import { DeleteCategoryUseCase } from '../../application/delete-category.use-case';
import { GetCategoryUseCase } from '../../application/get-category.use-case';
import { ListCategoriesUseCase } from '../../application/list-categories.use-case';
import { UpdateCategoryUseCase } from '../../application/update-category.use-case';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
/* eslint-enable @typescript-eslint/consistent-type-imports */
import type { CategoryResult } from '../../application/create-category.use-case';
import type { AuthenticatedUser } from '../../../auth/infrastructure/http/jwt.strategy';
import { JwtAuthGuard } from '../../../auth/infrastructure/http/jwt-auth.guard';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResult> {
    try {
      return await this.createCategoryUseCase.execute({
        ownerId: req.user.id,
        name: dto.name,
        kind: dto.kind,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Get()
  async list(@Req() req: AuthenticatedRequest): Promise<CategoryResult[]> {
    return this.listCategoriesUseCase.execute({ ownerId: req.user.id });
  }

  @Get(':id')
  async get(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<CategoryResult> {
    try {
      return await this.getCategoryUseCase.execute({ id, ownerId: req.user.id });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResult> {
    try {
      return await this.updateCategoryUseCase.execute({
        id,
        ownerId: req.user.id,
        name: dto.name,
        kind: dto.kind,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    try {
      await this.deleteCategoryUseCase.execute({ id, ownerId: req.user.id });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (error instanceof CategoryNotFoundError) {
      return new NotFoundException(error.message);
    }
    if (error instanceof CategoryAlreadyExistsError) {
      return new ConflictException(error.message);
    }
    if (error instanceof CategoryHasTransactionsError) {
      return new ConflictException(error.message);
    }
    if (error instanceof CategoryHasBudgetsError) {
      return new ConflictException(error.message);
    }
    return error as Error;
  }
}
