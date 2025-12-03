interface UnifiedResponse<T = any> {
  code: number;
  data: T;
  message: string;
  timestamp: string;
  path: string;
  traceId?: string;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages?: number;
  };
  errors?: any;
}

interface JwtPayload {
  sub: number;
  username: string;
  roles?: string[];
}
