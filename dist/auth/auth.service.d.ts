import { OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../database/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterUserDto } from './dto/register.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
export declare class AuthService implements OnModuleInit {
    private readonly userRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(userRepository: Repository<User>, jwtService: JwtService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    seedFromEnv(): Promise<{
        message: string;
        user?: any;
    }>;
    validateUser(loginDto: LoginDto): Promise<User>;
    login(user: User): Promise<{
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
    getProfile(userId: number): Promise<{
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
    findAllUsers(): Promise<{
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
    createUser(createUserDto: RegisterUserDto): Promise<{
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
    updateUser(id: number, dto: UpdateUserDto): Promise<{
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
    deleteUser(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
