import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { Role, UserType } from '@Common';
import { PrismaService } from '../../prisma/prisma.service';

// Metadata key used to attach required roles to handlers and controllers
export const ROLES_KEY = 'roles';

/**
 * Roles decorator to specify which roles are allowed to access an endpoint.
 * Example: @Roles(Role.Admin, Role.Author)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extract the required roles attached to the route handler or controller class
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are specified, allow access by default
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Deny access if user context is missing from request (e.g. if JwtAuthGuard wasn't run)
    if (!user || !user.type) return false;

    // 2. Superuser Bypass: Platform Admin has access to all routes automatically
    if (user.type === UserType.Admin) {
      return true;
    }

    // 3. Regular Users: Dynamic Role Lookup in the PostgreSQL Database
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    
    // Deny if user record no longer exists in database
    if (!dbUser) return false;

    // 4. Compare the user's database role against the route's required roles
    const userRole = dbUser.role.toLowerCase(); // 'author' or 'reader'
    return roles.some((role) => userRole === role.toLowerCase());
  }
}
