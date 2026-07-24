import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AccountNotFoundError } from '../../../accounts/domain/errors';
import { CategoryNotFoundError } from '../../../categories/domain/errors';
import { TransactionCategoryKindMismatchError, TransactionNotFoundError } from '../../domain/errors';
// NOTE: the use case and DTO classes below MUST stay as value imports (not
// `import type`), even though this file only uses them as parameter types.
// NestJS's constructor DI and ValidationPipe both rely on `emitDecoratorMetadata`
// capturing the real class reference at runtime; `import type` erases the
// import entirely, which breaks DI resolution and silently disables DTO
// validation (metatype degrades to `Object`).
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { CreateTransactionUseCase } from '../../application/create-transaction.use-case';
import { DeleteTransactionUseCase } from '../../application/delete-transaction.use-case';
import { GetTransactionUseCase } from '../../application/get-transaction.use-case';
import { ListTransactionsUseCase } from '../../application/list-transactions.use-case';
import { UpdateTransactionUseCase } from '../../application/update-transaction.use-case';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
/* eslint-enable @typescript-eslint/consistent-type-imports */
import type { TransactionResult } from '../../application/create-transaction.use-case';
import type { AuthenticatedUser } from '../../../auth/infrastructure/http/jwt.strategy';
import { JwtAuthGuard } from '../../../auth/infrastructure/http/jwt-auth.guard';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
    private readonly deleteTransactionUseCase: DeleteTransactionUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResult> {
    try {
      return await this.createTransactionUseCase.execute({
        ownerId: req.user.id,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        type: dto.type,
        amountCents: dto.amountCents,
        occurredOn: new Date(dto.occurredOn),
        note: dto.note,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Get()
  async list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListTransactionsQueryDto,
  ): Promise<TransactionResult[]> {
    return this.listTransactionsUseCase.execute({
      ownerId: req.user.id,
      accountId: query.accountId,
      categoryId: query.categoryId,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
    });
  }

  @Get(':id')
  async get(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<TransactionResult> {
    try {
      return await this.getTransactionUseCase.execute({ id, ownerId: req.user.id });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResult> {
    try {
      return await this.updateTransactionUseCase.execute({
        id,
        ownerId: req.user.id,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        type: dto.type,
        amountCents: dto.amountCents,
        occurredOn: dto.occurredOn ? new Date(dto.occurredOn) : undefined,
        note: dto.note,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    try {
      await this.deleteTransactionUseCase.execute({ id, ownerId: req.user.id });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (
      error instanceof TransactionNotFoundError ||
      error instanceof AccountNotFoundError ||
      error instanceof CategoryNotFoundError
    ) {
      return new NotFoundException(error.message);
    }
    if (error instanceof TransactionCategoryKindMismatchError) {
      return new BadRequestException(error.message);
    }
    return error as Error;
  }
}
