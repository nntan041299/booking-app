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

export interface WorkingHours {
  /** ISO day of week, 1 = Monday ... 7 = Sunday */
  dayOfWeek: number;
  /** "HH:mm" or "HH:mm:ss" */
  startTime: string;
  endTime: string;
}

export interface EmployeeItem {
  id: number;
  userId: number | null;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  active: boolean;
  workingHours: WorkingHours[];
  serviceIds: number[];
}

export interface EmployeePage {
  content: EmployeeItem[];
  number: number;
  totalPages: number;
  totalElements: number;
}

export interface SearchEmployeesParams {
  keyword?: string;
  /** Omit to include both active and inactive employees. */
  active?: boolean;
  page?: number;
  size?: number;
}

export const searchEmployees = async ({
  keyword,
  active,
  page = 0,
  size = 10,
}: SearchEmployeesParams = {}): Promise<EmployeePage> => {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (active !== undefined) query.set("active", String(active));
  if (keyword) query.set("keyword", keyword);
  const res = await request.get({
    path: `${ENDPOINT.ADMIN_EMPLOYEES}?${query}`,
  });
  return res.data.data;
};

/** Partial update: omitted fields are left unchanged by the backend. */
export interface UpdateEmployeePayload {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  active?: boolean;
  /** Replaces the whole weekly schedule when present. */
  workingHours?: WorkingHours[];
  /** Replaces the assigned services when present. */
  serviceIds?: number[];
}

export const updateEmployee = async (
  id: number,
  payload: UpdateEmployeePayload,
) => {
  return request.patch({
    path: `${ENDPOINT.ADMIN_EMPLOYEES}/${id}`,
    body: payload as unknown as Record<string, unknown>,
  });
};

/** Soft delete: the backend deactivates the employee and their login. */
export const removeEmployee = async (id: number) => {
  return request.delete({ path: `${ENDPOINT.ADMIN_EMPLOYEES}/${id}` });
};
