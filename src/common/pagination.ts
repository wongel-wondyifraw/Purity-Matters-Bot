export interface PageRequest {
  page: number;
  limit: number;
}

export interface PageResult<T> extends PageRequest {
  items: T[];
  total: number;
  totalPages: number;
}

// Keep pages bounded so a client cannot accidentally request an entire table.
export function normalizePage(page?: string, limit?: string): PageRequest {
  const parsedPage = Number.parseInt(page ?? '1', 10);
  const parsedLimit = Number.parseInt(limit ?? '25', 10);

  return {
    page: Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1,
    limit: Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 25,
  };
}

export function toPageResult<T>(
  items: T[],
  total: number,
  pageRequest: PageRequest,
): PageResult<T> {
  return {
    items,
    total,
    page: pageRequest.page,
    limit: pageRequest.limit,
    totalPages: Math.max(1, Math.ceil(total / pageRequest.limit)),
  };
}
