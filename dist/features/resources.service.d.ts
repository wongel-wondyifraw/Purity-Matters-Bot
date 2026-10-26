import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ResourcePurchase } from '../database/entities/resource-purchase.entity.js';
import { Resource } from '../database/entities/resource.entity.js';
import { PhysicalBookOrder, PhysicalOrderStatus } from '../database/entities/physical-book-order.entity.js';
import { ResourceOrder } from '../database/entities/resource-order.entity.js';
export interface ResourceItem {
    id: string;
    title: string;
    category: 'guide' | 'ebook' | 'devotional';
    isPaid: boolean;
    price: number;
    currency: string;
    description: string;
    downloadUrl: string;
}
export declare class ResourcesService implements OnModuleInit {
    private readonly purchaseRepo;
    private readonly resourceRepo;
    private readonly physicalOrderRepo;
    private readonly orderRepo;
    private readonly logger;
    private readonly catalog;
    constructor(purchaseRepo: Repository<ResourcePurchase>, resourceRepo: Repository<Resource>, physicalOrderRepo: Repository<PhysicalBookOrder>, orderRepo: Repository<ResourceOrder>);
    onModuleInit(): Promise<void>;
    findAllResources(filter?: {
        type?: string;
        pricingType?: string;
        search?: string;
    }): Promise<Resource[]>;
    findResourceById(id: number): Promise<Resource | null>;
    createResource(data: Partial<Resource>): Promise<Resource>;
    updateResource(id: number, data: Partial<Resource>): Promise<Resource | null>;
    deleteResource(id: number): Promise<boolean>;
    findAllPhysicalOrders(filter?: {
        status?: string;
    }): Promise<PhysicalBookOrder[]>;
    findPhysicalOrderById(id: number): Promise<PhysicalBookOrder | null>;
    createPhysicalOrder(data: Partial<PhysicalBookOrder>): Promise<PhysicalBookOrder>;
    updatePhysicalOrderStatus(id: number, status: PhysicalOrderStatus, dispatchNotes?: string): Promise<PhysicalBookOrder | null>;
    getCatalog(): ResourceItem[];
    getResource(id: string): ResourceItem | undefined;
    hasAccess(telegramId: string | number, resourceId: string | number): Promise<boolean>;
    grantAccess(telegramId: string | number, resourceId: string | number): Promise<ResourcePurchase | null>;
    getMyPurchases(telegramId: string | number): Promise<ResourcePurchase[]>;
    getAllPurchases(): Promise<ResourcePurchase[]>;
    countPurchases(): Promise<number>;
    createResourceOrder(data: {
        resourceId: number;
        telegramId: string | number;
        clientName?: string;
        username?: string;
        phone?: string;
        paymentMethod?: string;
    }): Promise<ResourceOrder>;
    submitOrderPayment(orderId: number, paymentMethod: string, paymentReference?: string): Promise<ResourceOrder | null>;
    findAllResourceOrders(filter?: {
        paymentStatus?: string;
        search?: string;
    }): Promise<ResourceOrder[]>;
    findResourceOrderById(id: number): Promise<ResourceOrder | null>;
    findPendingOrderByUserAndResource(telegramId: string | number, resourceId: number): Promise<ResourceOrder | null>;
    findActiveOrderByUserAndResource(telegramId: string | number, resourceId: number): Promise<ResourceOrder | null>;
    findOrdersByTelegramId(telegramId: string | number): Promise<ResourceOrder[]>;
    confirmOrderPayment(orderId: number, adminNotes?: string): Promise<{
        order: ResourceOrder;
        resource: Resource | null;
        alreadyVerified: boolean;
    }>;
    rejectOrderPayment(orderId: number, reason: string): Promise<ResourceOrder | null>;
    markOrderDelivered(orderId: number): Promise<ResourceOrder | null>;
    markOrderDeliveryFailed(orderId: number, errorMsg: string): Promise<ResourceOrder | null>;
    deletePhysicalOrder(id: number): Promise<boolean>;
    deleteResourceOrder(id: number): Promise<boolean>;
}
