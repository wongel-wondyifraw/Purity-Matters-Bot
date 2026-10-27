import { UserRole } from '../database/entities/user.entity.js';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: (UserRole | string)[]) => import("@nestjs/common").CustomDecorator<string>;
