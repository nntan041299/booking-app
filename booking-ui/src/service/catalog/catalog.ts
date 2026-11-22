import { request, ENDPOINT } from "@/rest";

export interface CreateServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

/** An optional image is sent in the same request and becomes the service image. */
export const createService = async (
  payload: CreateServicePayload,
  image?: File | null,
) => {
  return request.postMultipart(
    ENDPOINT.ADMIN_SERVICES,
    payload as unknown as Record<string, unknown>,
    { name: "image", file: image ?? null },
  );
};

export interface ServiceItem {
  id: number;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string;
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

export interface UpdateServicePayload extends CreateServicePayload {
  /** Clears the current image. Ignored when a new image file is sent. */
  removeImage?: boolean;
  active?: boolean;
}

/**
 * A full update. An optional image is sent in the same request and replaces the
 * current one; the backend deletes the image it replaces.
 */
export const updateService = async (
  id: number,
  payload: UpdateServicePayload,
  image?: File | null,
) => {
  return request.putMultipart(
    `${ENDPOINT.ADMIN_SERVICES}/${id}`,
    payload as unknown as Record<string, unknown>,
    { name: "image", file: image ?? null },
  );
};

/** Soft delete: the backend deactivates the service. */
export const removeService = async (id: number) => {
  return request.delete({ path: `${ENDPOINT.ADMIN_SERVICES}/${id}` });
};

export interface SearchAdminServicesParams extends SearchServicesParams {
  /** Omit to include both active and inactive services. */
  active?: boolean;
}

export const searchAdminServices = async ({
  keyword,
  active,
  page = 0,
  size = 10,
}: SearchAdminServicesParams = {}): Promise<ServicePage> => {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (active !== undefined) query.set("active", String(active));
  if (keyword) query.set("keyword", keyword);
  const res = await request.get({ path: `${ENDPOINT.SERVICES}?${query}` });
  return res.data.data;
};
