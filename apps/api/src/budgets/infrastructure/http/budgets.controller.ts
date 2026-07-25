import {
  BadRequestException,
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
import { CategoryNotFoundError } from '../../../categories/domain/errors';
import {
  BudgetAlreadyExistsError,
  BudgetCategoryKindMismatchError,
  BudgetNotFoundError,
} from '../../domain/errors';
// NOTE: the use case and DTO classes below MUST stay as value imports (not
// `import type`), even though this file only uses them as parameter types.
// NestJS's constructor DI and ValidationPipe both rely on `emitDecoratorMetadata`
// capturing the real class reference at runtime; `import type` erases the
// import entirely, which breaks DI resolution and silently disables DTO
// validation (metatype degrades to `Object`).
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { CreateBudgetUseCase } from '../../application/create-budget.use-case';
import { DeleteBudgetUseCase } from '../../application/delete-budget.use-case';
import { GetBudgetUseCase } from '../../application/get-budget.use-case';
import { ListBudgetsUseCase } from '../../application/list-budgets.use-case';
import { UpdateBudgetUseCase } from '../../application/update-budget.use-case';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
/* eslint-enable @typescript-eslint/consistent-type-imports */
import type { BudgetResult } from '../../application/create-budget.use-case';
import type { AuthenticatedUser } from '../../../auth/infrastructure/http/jwt.strategy';
import { JwtAuthGuard } from '../../../auth/infrastructure/http/jwt-auth.guard';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(
    private readonly createBudgetUseCase: CreateBudgetUseCase,
    private readonly listBudgetsUseCase: ListBudgetsUseCase,
    private readonly getBudgetUseCase: GetBudgetUseCase,
    private readonly updateBudgetUseCase: UpdateBudgetUseCase,
    private readonly deleteBudgetUseCase: DeleteBudgetUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateBudgetDto): Promise<BudgetResult> {
    try {
      return await this.createBudgetUseCase.execute({
        ownerId: req.user.id,
        categoryId: dto.categoryId,
        periodMonth: dto.periodMonth,
        limitCents: dto.limitCents,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Get()
  async list(@Req() req: AuthenticatedRequest): Promise<BudgetResult[]> {
    return this.listBudgetsUseCase.execute({ ownerId: req.user.id });
  }

  @Get(':id')
  async get(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<BudgetResult> {
    try {
      return await this.getBudgetUseCase.execute({ id, ownerId: req.user.id });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<BudgetResult> {
    try {
      return await this.updateBudgetUseCase.execute({
        id,
        ownerId: req.user.id,
        categoryId: dto.categoryId,
        periodMonth: dto.periodMonth,
        limitCents: dto.limitCents,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    try {
      await this.deleteBudgetUseCase.execute({ id, ownerId: req.user.id });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (error instanceof BudgetNotFoundError || error instanceof CategoryNotFoundError) {
      return new NotFoundException(error.message);
    }
    if (error instanceof BudgetAlreadyExistsError) {
      return new ConflictException(error.message);
    }
    if (error instanceof BudgetCategoryKindMismatchError) {
      return new BadRequestException(error.message);
    }
    return error as Error;
  }
}
