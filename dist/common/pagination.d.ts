export interface PageRequest {
    page: number;
    limit: number;
}
export interface PageResult<T> extends PageRequest {
    items: T[];
    total: number;
    totalPages: number;
}
export declare function normalizePage(page?: string, limit?: string): PageRequest;
export declare function toPageResult<T>(items: T[], total: number, pageRequest: PageRequest): PageResult<T>;
