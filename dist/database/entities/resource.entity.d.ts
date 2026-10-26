export type ResourceType = 'ebook' | 'physical_book';
export type PricingType = 'free' | 'paid';
export declare class Resource {
    id: number;
    title: string;
    author?: string | null;
    description?: string | null;
    type: ResourceType;
    pricingType: PricingType;
    price: number;
    currency: string;
    filePath?: string | null;
    fileName?: string | null;
    fileSizeBytes?: number | null;
    fileMimeType?: string | null;
    stockQuantity?: number | null;
    coverImageUrl?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
