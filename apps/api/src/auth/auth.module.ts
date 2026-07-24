import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoginUseCase } from './application/login.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { REFRESH_TOKEN_REPOSITORY } from './application/ports/refresh-token-repository.port';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { RefreshUseCase } from './application/refresh.use-case';
import { RegisterUseCase } from './application/register.use-case';
import { Argon2PasswordHasher } from './infrastructure/hashing/argon2-password-hasher';
import { AuthController } from './infrastructure/http/auth.controller';
import { JwtAuthGuard } from './infrastructure/http/jwt-auth.guard';
import { JwtStrategy } from './infrastructure/http/jwt.strategy';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/prisma-refresh-token.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { JwtTokenService } from './infrastructure/tokens/jwt-token.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    RegisterUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    JwtStrategy,
    JwtAuthGuard,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [JwtAuthGuard, PassportModule],
})
export class AuthModule {}
