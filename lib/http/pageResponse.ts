/** Refleja PageResponse (api-crmws, shared/presentation/PageResponse.java). */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
