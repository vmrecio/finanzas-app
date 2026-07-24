import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DuplicateEmailError, InvalidCredentialsError } from '../../domain/errors';
// NOTE: the use case and DTO classes below MUST stay as value imports (not
// `import type`), even though this file only uses them as parameter types.
// NestJS's constructor DI and ValidationPipe both rely on `emitDecoratorMetadata`
// capturing the real class reference at runtime; `import type` erases the
// import entirely, which breaks DI resolution and silently disables DTO
// validation (metatype degrades to `Object`).
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { LoginUseCase } from '../../application/login.use-case';
import { LogoutUseCase } from '../../application/logout.use-case';
import { RefreshUseCase } from '../../application/refresh.use-case';
import { RegisterUseCase } from '../../application/register.use-case';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
/* eslint-enable @typescript-eslint/consistent-type-imports */
import { REFRESH_TOKEN_TTL_MS } from '../../application/refresh-token-crypto';
import type { AuthenticatedUser } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto): Promise<{ id: string; email: string }> {
    try {
      return await this.registerUseCase.execute(dto);
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    try {
      const result = await this.loginUseCase.execute(dto);
      this.setRefreshCookie(res, result.refreshToken);
      return { accessToken: result.accessToken };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = this.readRefreshCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    try {
      const result = await this.refreshUseCase.execute({ refreshToken });
      this.setRefreshCookie(res, result.refreshToken);
      return { accessToken: result.accessToken };
    } catch (error) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException((error as Error).message);
    }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const refreshToken = this.readRefreshCookie(req);
    if (refreshToken) {
      await this.logoutUseCase.execute({ refreshToken });
    }
    this.clearRefreshCookie(res);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: AuthenticatedUser }): { id: string } {
    return { id: req.user.id };
  }

  private readRefreshCookie(req: Request): string | undefined {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.[REFRESH_COOKIE_NAME];
  }

  private setRefreshCookie(res: Response, value: string): void {
    res.cookie(REFRESH_COOKIE_NAME, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_MS,
      path: REFRESH_COOKIE_PATH,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  }
}
