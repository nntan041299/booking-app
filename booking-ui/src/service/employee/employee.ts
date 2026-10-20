import { request, ENDPOINT } from "@/rest";

export interface CreateEmployeePayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

export const createEmployee = async (payload: CreateEmployeePayload) => {
  return request.post({
    path: ENDPOINT.ADMIN_EMPLOYEES,
    body: payload as unknown as Record<string, unknown>,
  });
};
