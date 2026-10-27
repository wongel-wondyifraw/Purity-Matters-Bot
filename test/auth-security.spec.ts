import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import { RolesGuard } from '../src/auth/roles.guard.js';
import { ROLES_KEY } from '../src/auth/roles.decorator.js';
import { UserRole } from '../src/database/entities/user.entity.js';
import { AdminController } from '../src/admin/admin.controller.js';
import { UsersController } from '../src/auth/users.controller.js';
import { AuthController } from '../src/auth/auth.controller.js';

describe('Authentication & Authorization Security Guards', () => {
  let jwtGuard: JwtAuthGuard;
  let reflector: Reflector;
  let rolesGuard: RolesGuard;

  beforeEach(() => {
    jwtGuard = new JwtAuthGuard();
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  describe('JwtAuthGuard', () => {
    it('should throw UnauthorizedException when no user is resolved', () => {
      expect(() => {
        jwtGuard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw error when passport authentication errors', () => {
      expect(() => {
        jwtGuard.handleRequest(new Error('Token expired'), null, null);
      }).toThrow('Token expired');
    });

    it('should return user object when valid user is resolved', () => {
      const mockUser = { id: 2, email: 'counselor@puritymatters.org', role: UserRole.COUNSELOR };
      const result = jwtGuard.handleRequest(null, mockUser, null);
      expect(result).toEqual(mockUser);
    });
  });

  describe('RolesGuard', () => {
    function createMockContext(user: any): ExecutionContext {
      return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user }),
          getResponse: () => ({}),
        }),
      } as unknown as ExecutionContext;
    }

    it('should allow access if no roles are required on the route', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx = createMockContext({ id: 2, role: UserRole.COUNSELOR });
      expect(rolesGuard.canActivate(ctx)).toBe(true);
    });

    it('should throw ForbiddenException if user has no role or is missing', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const ctx = createMockContext(null);
      expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user role does not match required roles', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPERADMIN, UserRole.ADMIN]);
      const ctx = createMockContext({ id: 2, email: 'counselor@puritymatters.org', role: UserRole.COUNSELOR });
      expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow access if user has one of the required roles', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPERADMIN, UserRole.ADMIN]);
      const ctx = createMockContext({ id: 1, email: 'admin@puritymatters.org', role: UserRole.ADMIN });
      expect(rolesGuard.canActivate(ctx)).toBe(true);
    });

    it('should allow SUPERADMIN access when SUPERADMIN is permitted', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.SUPERADMIN, UserRole.ADMIN]);
      const ctx = createMockContext({ id: 1, email: 'super@puritymatters.org', role: UserRole.SUPERADMIN });
      expect(rolesGuard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Controller Guard Annotations', () => {
    it('AdminController must be protected by JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AdminController);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('UsersController must be protected by JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', UsersController);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);

      const roles = Reflect.getMetadata(ROLES_KEY, UsersController);
      expect(roles).toEqual([UserRole.SUPERADMIN, UserRole.ADMIN]);
    });

    it('AuthController register & seed endpoints must have guards', () => {
      const registerGuards = Reflect.getMetadata('__guards__', AuthController.prototype.register);
      expect(registerGuards).toBeDefined();
      expect(registerGuards).toContain(JwtAuthGuard);

      const seedGuards = Reflect.getMetadata('__guards__', AuthController.prototype.seedAdmin);
      expect(seedGuards).toBeDefined();
      expect(seedGuards).toContain(JwtAuthGuard);
    });
  });
});
