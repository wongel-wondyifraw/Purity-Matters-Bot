var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
import { Injectable, Logger, UnauthorizedException, ConflictException, NotFoundException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../database/entities/user.entity.js';
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    jwtService;
    configService;
    logger = new Logger(AuthService_1.name);
    constructor(userRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async onModuleInit() {
        await this.seedFromEnv();
    }
    async seedFromEnv() {
        try {
            const defaultEmail = (this.configService.get('defaultAdmin.email') ||
                process.env.DEFAULT_ADMIN_EMAIL ||
                'admin@puritymatters.org')
                .toLowerCase()
                .trim();
            const defaultPassword = this.configService.get('defaultAdmin.password') ||
                process.env.DEFAULT_ADMIN_PASSWORD ||
                'Admin@12345';
            const firstName = this.configService.get('defaultAdmin.firstName') ||
                process.env.DEFAULT_ADMIN_FIRST_NAME ||
                'Bereket';
            const middleName = this.configService.get('defaultAdmin.middleName') ||
                process.env.DEFAULT_ADMIN_MIDDLE_NAME ||
                'Tadesse';
            const lastName = this.configService.get('defaultAdmin.lastName') ||
                process.env.DEFAULT_ADMIN_LAST_NAME ||
                'Alemu';
            const role = this.configService.get('defaultAdmin.role') ||
                process.env.DEFAULT_ADMIN_ROLE ||
                UserRole.SUPERADMIN;
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            let user = await this.userRepository.findOne({
                where: { email: defaultEmail },
            });
            if (!user) {
                user = this.userRepository.create({
                    firstName,
                    middleName,
                    lastName,
                    email: defaultEmail,
                    password: hashedPassword,
                    role,
                    isActive: true,
                });
                await this.userRepository.save(user);
                this.logger.log(`Administrator successfully seeded from .env: ${defaultEmail} (Password from .env: ${defaultPassword})`);
                return { message: `Administrator seeded from .env: ${defaultEmail}` };
            }
            else {
                user.firstName = firstName;
                user.middleName = middleName;
                user.lastName = lastName;
                user.role = role;
                user.isActive = true;
                user.password = hashedPassword;
                await this.userRepository.save(user);
                this.logger.log(`Administrator synchronized with .env settings: ${defaultEmail}`);
                return { message: `Administrator synchronized with .env: ${defaultEmail}` };
            }
        }
        catch (error) {
            this.logger.error('Failed to seed administrator from .env:', error);
            throw error;
        }
    }
    async validateUser(loginDto) {
        const normalizedEmail = loginDto.email.toLowerCase().trim();
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('LOWER(user.email) = :email', { email: normalizedEmail })
            .getOne();
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        if (!user.isActive) {
            throw new UnauthorizedException('This user account has been deactivated');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }
        user.lastLoginAt = new Date();
        await this.userRepository.update(user.id, { lastLoginAt: user.lastLoginAt });
        return user;
    }
    async login(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            accessToken,
            user: {
                id: user.id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                fullName: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '),
                email: user.email,
                role: user.role,
                lastLoginAt: user.lastLoginAt,
            },
        };
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, isActive: true },
        });
        if (!user) {
            throw new NotFoundException('User profile not found');
        }
        return {
            id: user.id,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            fullName: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '),
            email: user.email,
            role: user.role,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        };
    }
    async findAllUsers() {
        const users = await this.userRepository.find({
            order: { id: 'ASC' },
        });
        return users.map((u) => ({
            id: u.id,
            firstName: u.firstName,
            middleName: u.middleName,
            lastName: u.lastName,
            fullName: [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' '),
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            lastLoginAt: u.lastLoginAt,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
        }));
    }
    async createUser(createUserDto) {
        return this.register(createUserDto);
    }
    async register(registerDto) {
        const normalizedEmail = registerDto.email.toLowerCase().trim();
        const existing = await this.userRepository.findOne({
            where: { email: normalizedEmail },
        });
        if (existing) {
            throw new ConflictException('A user with this email address already exists');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const newUser = this.userRepository.create({
            firstName: registerDto.firstName.trim(),
            middleName: registerDto.middleName ? registerDto.middleName.trim() : null,
            lastName: registerDto.lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: registerDto.role || UserRole.ADMIN,
            isActive: true,
        });
        const saved = await this.userRepository.save(newUser);
        return {
            id: saved.id,
            firstName: saved.firstName,
            middleName: saved.middleName,
            lastName: saved.lastName,
            fullName: [saved.firstName, saved.middleName, saved.lastName].filter(Boolean).join(' '),
            email: saved.email,
            role: saved.role,
            isActive: saved.isActive,
            createdAt: saved.createdAt,
        };
    }
    async updateUser(id, dto) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
            const emailTaken = await this.userRepository.findOne({
                where: { email: dto.email.toLowerCase().trim() },
            });
            if (emailTaken) {
                throw new ConflictException('Email address is already in use by another user');
            }
            user.email = dto.email.toLowerCase().trim();
        }
        if (dto.firstName !== undefined)
            user.firstName = dto.firstName.trim();
        if (dto.middleName !== undefined) {
            user.middleName = dto.middleName ? dto.middleName.trim() : null;
        }
        if (dto.lastName !== undefined)
            user.lastName = dto.lastName.trim();
        if (dto.role !== undefined)
            user.role = dto.role;
        if (dto.isActive !== undefined)
            user.isActive = dto.isActive;
        if (dto.password && dto.password.trim().length >= 6) {
            user.password = await bcrypt.hash(dto.password.trim(), 10);
        }
        const saved = await this.userRepository.save(user);
        return {
            id: saved.id,
            firstName: saved.firstName,
            middleName: saved.middleName,
            lastName: saved.lastName,
            fullName: [saved.firstName, saved.middleName, saved.lastName].filter(Boolean).join(' '),
            email: saved.email,
            role: saved.role,
            isActive: saved.isActive,
            lastLoginAt: saved.lastLoginAt,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        };
    }
    async deleteUser(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        const totalUsers = await this.userRepository.count();
        if (totalUsers <= 1) {
            throw new ConflictException('Cannot delete the last remaining administrator user');
        }
        await this.userRepository.remove(user);
        return { success: true, message: `User ${user.email} removed successfully` };
    }
};
AuthService = AuthService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        JwtService,
        ConfigService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map