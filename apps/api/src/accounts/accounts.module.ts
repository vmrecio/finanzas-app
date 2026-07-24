import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { ACCOUNT_REPOSITORY } from './application/ports/account-repository.port';
import { TRANSACTION_EXISTENCE } from './application/ports/transaction-existence.port';
import { CreateAccountUseCase } from './application/create-account.use-case';
import { DeleteAccountUseCase } from './application/delete-account.use-case';
import { GetAccountUseCase } from './application/get-account.use-case';
import { ListAccountsUseCase } from './application/list-accounts.use-case';
import { UpdateAccountUseCase } from './application/update-account.use-case';
import { AccountsController } from './infrastructure/http/accounts.controller';
import { NoTransactionsYetAdapter } from './infrastructure/persistence/no-transactions-yet.adapter';
import { PrismaAccountRepository } from './infrastructure/persistence/prisma-account.repository';

@Module({
  // AuthModule provides JwtAuthGuard (used on AccountsController) and, by
  // being part of the module graph, instantiates JwtStrategy so Passport's
  // 'jwt' strategy is registered (see auth.module.ts / jwt-auth.guard.ts —
  // ownership scoping composes directly on top of the existing auth
  // identity, no additional identity plumbing needed).
  imports: [AuthModule],
  controllers: [AccountsController],
  providers: [
    PrismaService,
    CreateAccountUseCase,
    ListAccountsUseCase,
    GetAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
    { provide: TRANSACTION_EXISTENCE, useClass: NoTransactionsYetAdapter },
  ],
})
export class AccountsModule {}
