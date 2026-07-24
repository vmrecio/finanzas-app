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
import { AccountHasTransactionsError, AccountNotFoundError } from '../../domain/errors';
// NOTE: the use case and DTO classes below MUST stay as value imports (not
// `import type`), even though this file only uses them as parameter types.
// NestJS's constructor DI and ValidationPipe both rely on `emitDecoratorMetadata`
// capturing the real class reference at runtime; `import type` erases the
// import entirely, which breaks DI resolution and silently disables DTO
// validation (metatype degrades to `Object`).
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { CreateAccountUseCase } from '../../application/create-account.use-case';
import { DeleteAccountUseCase } from '../../application/delete-account.use-case';
import { GetAccountUseCase } from '../../application/get-account.use-case';
import { ListAccountsUseCase } from '../../application/list-accounts.use-case';
import { UpdateAccountUseCase } from '../../application/update-account.use-case';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
/* eslint-enable @typescript-eslint/consistent-type-imports */
import type { AccountResult } from '../../application/create-account.use-case';
import type { AuthenticatedUser } from '../../../auth/infrastructure/http/jwt.strategy';
import { JwtAuthGuard } from '../../../auth/infrastructure/http/jwt-auth.guard';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateAccountDto): Promise<AccountResult> {
    return this.createAccountUseCase.execute({
      ownerId: req.user.id,
      name: dto.name,
      type: dto.type,
    });
  }

  @Get()
  async list(@Req() req: AuthenticatedRequest): Promise<AccountResult[]> {
    return this.listAccountsUseCase.execute({ ownerId: req.user.id });
  }

  @Get(':id')
  async get(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<AccountResult> {
    try {
      return await this.getAccountUseCase.execute({ id, ownerId: req.user.id });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResult> {
    try {
      return await this.updateAccountUseCase.execute({
        id,
        ownerId: req.user.id,
        name: dto.name,
        type: dto.type,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    try {
      await this.deleteAccountUseCase.execute({ id, ownerId: req.user.id });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (error instanceof AccountNotFoundError) {
      return new NotFoundException(error.message);
    }
    if (error instanceof AccountHasTransactionsError) {
      return new ConflictException(error.message);
    }
    return error as Error;
  }
}
