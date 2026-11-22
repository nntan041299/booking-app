import { request, ENDPOINT } from "@/rest";

export type ResourceType = "ROOM" | "EQUIPMENT";

export interface ResourceItem {
  id: number;
  name: string;
  type: ResourceType;
  description?: string;
  imageUrl?: string;
  active: boolean;
  /** The services that can use this resource. */
  serviceIds: number[];
}

export interface ResourcePage {
  content: ResourceItem[];
  number: number;
  totalPages: number;
  totalElements: number;
}

export interface SearchResourcesParams {
  keyword?: string;
  type?: ResourceType;
  /** Omit to include both active and inactive resources. */
  active?: boolean;
  /** Only resources that can be used with this service. */
  serviceId?: number;
  page?: number;
  size?: number;
}

export const searchResources = async ({
  keyword,
  type,
  active,
  serviceId,
  page = 0,
  size = 10,
}: SearchResourcesParams = {}): Promise<ResourcePage> => {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (keyword) query.set("keyword", keyword);
  if (type) query.set("type", type);
  if (active !== undefined) query.set("active", String(active));
  if (serviceId !== undefined) query.set("serviceId", String(serviceId));
  const res = await request.get({
    path: `${ENDPOINT.ADMIN_RESOURCES}?${query}`,
  });
  return res.data.data;
};

export const getResource = async (id: number): Promise<ResourceItem> => {
  const res = await request.get({ path: `${ENDPOINT.ADMIN_RESOURCES}/${id}` });
  return res.data.data;
};

export interface CreateResourcePayload {
  name: string;
  type: ResourceType;
  description?: string;
  serviceIds?: number[];
}

/** An optional image is sent in the same request and becomes the resource image. */
export const createResource = async (
  payload: CreateResourcePayload,
  image?: File | null,
): Promise<ResourceItem> => {
  const res = await request.postMultipart(
    ENDPOINT.ADMIN_RESOURCES,
    payload as unknown as Record<string, unknown>,
    { name: "image", file: image ?? null },
  );
  return res.data.data;
};

/** Full update of the editable fields; `active` and `serviceIds` are left unchanged when omitted. */
export interface UpdateResourcePayload extends CreateResourcePayload {
  /** Clears the current image. Ignored when a new image file is sent. */
  removeImage?: boolean;
  active?: boolean;
}

/**
 * An optional image is sent in the same request and replaces the current one;
 * the image is left unchanged when neither a file nor `removeImage` is sent.
 */
export const updateResource = async (
  id: number,
  payload: UpdateResourcePayload,
  image?: File | null,
): Promise<ResourceItem> => {
  const res = await request.putMultipart(
    `${ENDPOINT.ADMIN_RESOURCES}/${id}`,
    payload as unknown as Record<string, unknown>,
    { name: "image", file: image ?? null },
  );
  return res.data.data;
};
