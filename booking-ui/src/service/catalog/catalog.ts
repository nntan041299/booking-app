import { request, ENDPOINT } from "@/rest";

export interface CreateServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

export const createService = async (payload: CreateServicePayload) => {
  return request.post({
    path: ENDPOINT.ADMIN_SERVICES,
    body: payload as unknown as Record<string, unknown>,
  });
};

export interface ServiceItem {
  id: number;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active: boolean;
}

export interface ServicePage {
  content: ServiceItem[];
  number: number;
  totalPages: number;
  totalElements: number;
}

export interface SearchServicesParams {
  keyword?: string;
  page?: number;
  size?: number;
}

export const searchServices = async ({
  keyword,
  page = 0,
  size = 9,
}: SearchServicesParams = {}): Promise<ServicePage> => {
  const query = new URLSearchParams({
    active: "true",
    page: String(page),
    size: String(size),
  });
  if (keyword) query.set("keyword", keyword);
  const res = await request.get({ path: `${ENDPOINT.SERVICES}?${query}` });
  return res.data.data;
};
