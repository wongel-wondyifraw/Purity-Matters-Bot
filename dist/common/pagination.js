export function normalizePage(page, limit) {
    const parsedPage = Number.parseInt(page ?? '1', 10);
    const parsedLimit = Number.parseInt(limit ?? '25', 10);
    return {
        page: Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1,
        limit: Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 25,
    };
}
export function toPageResult(items, total, pageRequest) {
    return {
        items,
        total,
        page: pageRequest.page,
        limit: pageRequest.limit,
        totalPages: Math.max(1, Math.ceil(total / pageRequest.limit)),
    };
}
//# sourceMappingURL=pagination.js.map