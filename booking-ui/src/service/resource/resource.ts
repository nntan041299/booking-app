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
  imageUrl?: string;
  serviceIds?: number[];
}

export const createResource = async (
  payload: CreateResourcePayload,
): Promise<ResourceItem> => {
  const res = await request.post({
    path: ENDPOINT.ADMIN_RESOURCES,
    body: payload as unknown as Record<string, unknown>,
  });
  return res.data.data;
};

/** Full update of the editable fields; `active` and `serviceIds` are left unchanged when omitted. */
export interface UpdateResourcePayload extends CreateResourcePayload {
  active?: boolean;
}

export const updateResource = async (
  id: number,
  payload: UpdateResourcePayload,
): Promise<ResourceItem> => {
  const res = await request.put({
    path: `${ENDPOINT.ADMIN_RESOURCES}/${id}`,
    body: payload as unknown as Record<string, unknown>,
  });
  return res.data.data;
};
