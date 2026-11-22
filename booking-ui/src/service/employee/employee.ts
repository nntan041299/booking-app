import { request, ENDPOINT } from "@/rest";

export interface CreateEmployeePayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  bio?: string;
  workingHours?: WorkingHours[];
  serviceIds?: number[];
}

/** An optional avatar image is sent in the same request; it becomes the employee's avatar. */
export const createEmployee = async (
  payload: CreateEmployeePayload,
  avatar?: File | null,
) => {
  return request.postMultipart(
    ENDPOINT.ADMIN_EMPLOYEES,
    payload as unknown as Record<string, unknown>,
    { name: "avatar", file: avatar ?? null },
  );
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
  /** Only employees who perform this service. */
  serviceId?: number;
  page?: number;
  size?: number;
}

export const searchEmployees = async ({
  keyword,
  active,
  serviceId,
  page = 0,
  size = 10,
}: SearchEmployeesParams = {}): Promise<EmployeePage> => {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (active !== undefined) query.set("active", String(active));
  if (serviceId !== undefined) query.set("serviceId", String(serviceId));
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
  /** Clears the current avatar. Ignored when a new avatar file is sent. */
  removeAvatar?: boolean;
  active?: boolean;
  /** Replaces the whole weekly schedule when present. */
  workingHours?: WorkingHours[];
  /** Replaces the assigned services when present. */
  serviceIds?: number[];
}

/**
 * An optional avatar image is sent in the same request and becomes the employee's
 * avatar; the backend deletes the image it replaces.
 */
export const updateEmployee = async (
  id: number,
  payload: UpdateEmployeePayload,
  avatar?: File | null,
) => {
  return request.patchMultipart(
    `${ENDPOINT.ADMIN_EMPLOYEES}/${id}`,
    payload as unknown as Record<string, unknown>,
    { name: "avatar", file: avatar ?? null },
  );
};

/** Soft delete: the backend deactivates the employee and their login. */
export const removeEmployee = async (id: number) => {
  return request.delete({ path: `${ENDPOINT.ADMIN_EMPLOYEES}/${id}` });
};
