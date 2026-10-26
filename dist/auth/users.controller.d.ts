import { AuthService } from './auth.service.js';
import { RegisterUserDto } from './dto/register.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
export declare class UsersController {
    private readonly authService;
    constructor(authService: AuthService);
    findAll(): Promise<{
        id: number;
        firstName: string;
        middleName: string | null | undefined;
        lastName: string;
        fullName: string;
        email: string;
        role: string;
        isActive: boolean;
        lastLoginAt: Date | null | undefined;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(createUserDto: RegisterUserDto): Promise<{
        id: number;
        firstName: string;
        middleName: string | null | undefined;
        lastName: string;
        fullName: string;
        email: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    }>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<{
        id: number;
        firstName: string;
        middleName: string | null | undefined;
        lastName: string;
        fullName: string;
        email: string;
        role: string;
        isActive: boolean;
        lastLoginAt: Date | null | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
