import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [AuthModule, AccountsModule, CategoriesModule],
  controllers: [AppController],
})
export class AppModule {}
