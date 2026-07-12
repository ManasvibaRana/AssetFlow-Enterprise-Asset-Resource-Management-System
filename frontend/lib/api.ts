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
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
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

export type DirectoryPerson = {
  id: string;
  name: string;
  title: string;
  department: string | null;
};

// Assets are the master data for bookable resources (those with is_bookable = true).
export type AssetSummary = {
  id: number;
  name: string;
  asset_tag: string;
  is_bookable: boolean;
  status: string;
};

// Bookable resources (conference rooms) — master data managed in Organization Setup.
export type Resource = {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  amenities: string[];
  status: string;
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

  // --- directory (lightweight people list for pickers; any authenticated user) ---
  listDirectory: () => request<DirectoryPerson[]>("/employees/directory"),

  // --- assets (P2) — used to source bookable resources ---
  listAssets: () => request<AssetSummary[]>("/api/assets"),

  // --- resources (booking master data; CRUD in Organization Setup) ---
  listResources: () => request<Resource[]>("/resources"),
  createResource: (r: Omit<Resource, "id">) => request<Resource>("/resources", { method: "POST", body: JSON.stringify(r) }),
  updateResource: (id: string, r: Omit<Resource, "id">) =>
    request<Resource>(`/resources/${id}`, { method: "PUT", body: JSON.stringify(r) }),
  deleteResource: (id: string) => request<null>(`/resources/${id}`, { method: "DELETE" }),

  // --- employees ---
  listEmployees: () => request<Employee[]>("/employees"),
  createEmployee: (e: { name: string; title?: string; email: string; department?: string | null }) =>
    request<Employee>("/employees", { method: "POST", body: JSON.stringify(e) }),
  changeEmployeeRole: (id: string, role: Role) =>
    request<Employee>(`/employees/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  changeEmployeeStatus: (id: string, status: Status) =>
    request<Employee>(`/employees/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
