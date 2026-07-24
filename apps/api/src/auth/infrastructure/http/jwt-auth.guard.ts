import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Ownership scoping composes directly on top of this guard: controllers in
 * every other capability (accounts, categories, transactions, ...) read
 * `request.user.id` set here and pass it as `ownerId` into their use cases
 * (see design.md "Ownership scoping / data isolation").
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
