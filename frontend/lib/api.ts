// Thin API client for the AssetFlow FastAPI backend.
import type { Category, Department, Employee, Role, Status } from "@/lib/mock/org";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail =
          typeof body.detail === "string"
            ? body.detail
            : (body.detail.message ?? JSON.stringify(body.detail));
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export type AuthUser = {
  id: string;
  name: string;
  title: string;
  email: string;
  department: string | null;
  role: Role;
  status: Status;
};

export type AuthResponse = { token: string; user: AuthUser };

export type AppNotification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type AssetHistory = { id: number; event_type: string; detail: string; created_at: string };

export type Asset = {
  id: number;
  name: string;
  asset_tag: string;
  serial_number?: string | null;
  category_id?: string | null;
  acquisition_date?: string | null;
  acquisition_cost?: string | null;
  condition: string;
  location?: string | null;
  is_bookable: boolean;
  status: string;
  photo_url?: string | null;
  created_at?: string;
  active_allocation?: {
    id: number;
    holder_emp_id?: string | null;
    holder_dept_id?: string | null;
    expected_return_date?: string | null;
  } | null;
  history: AssetHistory[];
};

export type AssetCreateInput = {
  name: string;
  serial_number?: string | null;
  category_id?: string | null;
  acquisition_date?: string | null;
  acquisition_cost?: string | null;
  condition: string;
  location?: string | null;
  is_bookable: boolean;
  photo_url?: string | null;
};

export const api = {
  // --- auth ---
  signup: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<AuthUser>("/auth/me"),
  updateProfile: (data: { name: string; title: string }) =>
    request<AuthUser>("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    request<{ ok: boolean }>("/auth/change-password", { method: "POST", body: JSON.stringify(data) }),
  forgotPassword: (email: string) =>
    request<{ ok: boolean }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  // --- departments ---
  listDepartments: () => request<Department[]>("/departments"),
  createDepartment: (d: Omit<Department, "id">) =>
    request<Department>("/departments", { method: "POST", body: JSON.stringify(d) }),
  updateDepartment: (id: string, d: Omit<Department, "id">) =>
    request<Department>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  deleteDepartment: (id: string) => request<null>(`/departments/${id}`, { method: "DELETE" }),

  // --- categories ---
  listCategories: () => request<Category[]>("/categories"),
  createCategory: (c: Omit<Category, "id">) =>
    request<Category>("/categories", { method: "POST", body: JSON.stringify(c) }),
  updateCategory: (id: string, c: Omit<Category, "id">) =>
    request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(c) }),
  deleteCategory: (id: string) => request<null>(`/categories/${id}`, { method: "DELETE" }),

  // --- employees ---
  listEmployees: () => request<Employee[]>("/employees"),
  createEmployee: (e: { name: string; title?: string; email: string; department?: string | null }) =>
    request<Employee>("/employees", { method: "POST", body: JSON.stringify(e) }),
  changeEmployeeRole: (id: string, role: Role) =>
    request<Employee>(`/employees/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  changeEmployeeStatus: (id: string, status: Status) =>
    request<Employee>(`/employees/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // --- notifications ---
  listNotifications: () => request<AppNotification[]>("/notifications"),
  markNotificationRead: (id: string) => request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request<{ ok: boolean }>("/notifications/read-all", { method: "POST" }),

  // Lightweight employee lookup for pickers (any authenticated user).
  listEmployeeOptions: () =>
    request<{ id: string; name: string; email: string; department: string | null }[]>("/employees/options"),

  // --- assets (P2 module, mounted at /api/assets) ---
  listAssets: (params?: { q?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Asset[]>(`/api/assets${suffix}`);
  },
  createAsset: (data: AssetCreateInput) => request<Asset>("/api/assets", { method: "POST", body: JSON.stringify(data) }),
  allocateAsset: (id: number, data: { holder_emp_id?: string; holder_dept_id?: string; expected_return_date?: string | null }) =>
    request<{ id: number; status: string }>(`/api/assets/${id}/allocate`, { method: "POST", body: JSON.stringify(data) }),
  returnAsset: (id: number, data: { checkin_notes: string }) =>
    request<{ status: string }>(`/api/assets/${id}/return`, { method: "POST", body: JSON.stringify(data) }),
  requestTransfer: (id: number, data: { to_holder: string }) =>
    request<{ id: number; status: string }>(`/api/assets/${id}/transfers`, { method: "POST", body: JSON.stringify(data) }),
};
