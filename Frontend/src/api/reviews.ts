import { get, post } from './client';

const BASE_URL = '/reviews';

export async function listReviews(params?: any) {
  return get<any[]>(BASE_URL, params);
}

export async function createReview(data: { targetId: string; targetType: string; rating: number; comment?: string }) {
  return post<any>(BASE_URL, data);
}

export async function getStats(params?: any) {
  return get<any>(`${BASE_URL}/stats`, params);
}
