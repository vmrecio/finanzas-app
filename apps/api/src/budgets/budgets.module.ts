import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { PrismaService } from '../prisma/prisma.service';
import { BUDGET_ACTUALS } from './application/ports/budget-actuals.port';
import { BUDGET_REPOSITORY } from './application/ports/budget-repository.port';
import { CreateBudgetUseCase } from './application/create-budget.use-case';
import { DeleteBudgetUseCase } from './application/delete-budget.use-case';
import { GetBudgetUseCase } from './application/get-budget.use-case';
import { ListBudgetsUseCase } from './application/list-budgets.use-case';
import { UpdateBudgetUseCase } from './application/update-budget.use-case';
import { BudgetsController } from './infrastructure/http/budgets.controller';
import { PrismaBudgetActualsAdapter } from './infrastructure/persistence/prisma-budget-actuals.adapter';
import { PrismaBudgetRepository } from './infrastructure/persistence/prisma-budget.repository';

@Module({
  // AuthModule provides JwtAuthGuard (used on BudgetsController), same as
  // accounts/categories/transactions. CategoriesModule is imported (and
  // exports CATEGORY_REPOSITORY) so Create/UpdateBudgetUseCase can verify
  // that a referenced categoryId belongs to the same owner AND is an
  // expense category (see design.md "Invariants" — "budgets only on
  // expense categories"), exactly like TransactionsModule does for
  // AccountsModule/CategoriesModule. Unlike TransactionsModule, Budgets
  // does NOT import TransactionsModule: the actual-vs-limit aggregation
  // queries Prisma directly (see PrismaBudgetActualsAdapter), mirroring
  // ReportingModule's direct-query approach rather than depending on the
  // Transactions module's internals.
  imports: [AuthModule, CategoriesModule],
  controllers: [BudgetsController],
  providers: [
    PrismaService,
    CreateBudgetUseCase,
    ListBudgetsUseCase,
    GetBudgetUseCase,
    UpdateBudgetUseCase,
    DeleteBudgetUseCase,
    { provide: BUDGET_REPOSITORY, useClass: PrismaBudgetRepository },
    { provide: BUDGET_ACTUALS, useClass: PrismaBudgetActualsAdapter },
  ],
})
export class BudgetsModule {}
