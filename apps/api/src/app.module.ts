import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, AccountsModule],
  controllers: [AppController],
})
export class AppModule {}
