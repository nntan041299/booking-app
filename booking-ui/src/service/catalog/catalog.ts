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
