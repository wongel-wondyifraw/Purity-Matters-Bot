export declare enum UserRole {
    SUPERADMIN = "superadmin",
    ADMIN = "admin",
    COUNSELOR = "counselor"
}
export declare class User {
    id: number;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    email: string;
    password: string;
    role: string;
    isActive: boolean;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
