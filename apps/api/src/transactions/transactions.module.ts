import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { PrismaService } from '../prisma/prisma.service';
import { TRANSACTION_REPOSITORY } from './application/ports/transaction-repository.port';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { DeleteTransactionUseCase } from './application/delete-transaction.use-case';
import { GetTransactionUseCase } from './application/get-transaction.use-case';
import { ListTransactionsUseCase } from './application/list-transactions.use-case';
import { UpdateTransactionUseCase } from './application/update-transaction.use-case';
import { TransactionsController } from './infrastructure/http/transactions.controller';
import { PrismaTransactionRepository } from './infrastructure/persistence/prisma-transaction.repository';

@Module({
  // AuthModule provides JwtAuthGuard (used on TransactionsController), same
  // as accounts/categories. AccountsModule and CategoriesModule are also
  // imported (and export their *_REPOSITORY tokens) so
  // Create/UpdateTransactionUseCase can verify that a referenced
  // accountId/categoryId belongs to the same owner — the second IDOR
  // surface per design.md (Phase 5 depends on Accounts+Categories).
  imports: [AuthModule, AccountsModule, CategoriesModule],
  controllers: [TransactionsController],
  providers: [
    PrismaService,
    CreateTransactionUseCase,
    ListTransactionsUseCase,
    GetTransactionUseCase,
    UpdateTransactionUseCase,
    DeleteTransactionUseCase,
    { provide: TRANSACTION_REPOSITORY, useClass: PrismaTransactionRepository },
  ],
})
export class TransactionsModule {}
