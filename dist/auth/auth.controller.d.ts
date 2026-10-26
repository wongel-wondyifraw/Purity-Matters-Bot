import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterUserDto } from './dto/register.dto.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            firstName: string;
            middleName: string | null | undefined;
            lastName: string;
            fullName: string;
            email: string;
            role: string;
            lastLoginAt: Date | null | undefined;
        };
    }>;
    getProfile(req: any): Promise<{
        id: number;
        firstName: string;
        middleName: string | null | undefined;
        lastName: string;
        fullName: string;
        email: string;
        role: string;
        lastLoginAt: Date | null | undefined;
        createdAt: Date;
    }>;
    register(registerDto: RegisterUserDto): Promise<{
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
    seedAdmin(): Promise<{
        message: string;
        user?: any;
    }>;
}
