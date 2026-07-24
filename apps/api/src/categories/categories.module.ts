import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { CATEGORY_REPOSITORY } from './application/ports/category-repository.port';
import { TRANSACTION_REFERENCE } from './application/ports/transaction-reference.port';
import { CreateCategoryUseCase } from './application/create-category.use-case';
import { DeleteCategoryUseCase } from './application/delete-category.use-case';
import { GetCategoryUseCase } from './application/get-category.use-case';
import { ListCategoriesUseCase } from './application/list-categories.use-case';
import { UpdateCategoryUseCase } from './application/update-category.use-case';
import { CategoriesController } from './infrastructure/http/categories.controller';
import { NoTransactionsYetAdapter } from './infrastructure/persistence/no-transactions-yet.adapter';
import { PrismaCategoryRepository } from './infrastructure/persistence/prisma-category.repository';

@Module({
  // AuthModule provides JwtAuthGuard (used on CategoriesController) and, by
  // being part of the module graph, instantiates JwtStrategy so Passport's
  // 'jwt' strategy is registered (see auth.module.ts / jwt-auth.guard.ts —
  // ownership scoping composes directly on top of the existing auth
  // identity, no additional identity plumbing needed).
  imports: [AuthModule],
  controllers: [CategoriesController],
  providers: [
    PrismaService,
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    GetCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
    { provide: TRANSACTION_REFERENCE, useClass: NoTransactionsYetAdapter },
  ],
})
export class CategoriesModule {}
