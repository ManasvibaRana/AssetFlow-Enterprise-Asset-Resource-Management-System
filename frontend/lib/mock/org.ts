// Mock data for the Organization Setup screen (P1).
// TODO(P1): replace these seeds with calls to the FastAPI /org endpoints.

export type Status = "active" | "inactive" | "on_leave";
export type Role = "employee" | "dept_head" | "asset_manager" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  dept_head: "Dept Head",
  asset_manager: "Asset Manager",
  admin: "Admin",
};

// Roles an admin can assign from the directory (admin itself is not self-assignable here).
export const ASSIGNABLE_ROLES: Role[] = ["employee", "dept_head", "asset_manager"];

export type Department = {
  id: string;
  name: string;
  head: string | null;
  parent: string | null;
  status: Exclude<Status, "on_leave">;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  customFields: Record<string, string>;
  status: Exclude<Status, "on_leave">;
};

export type Employee = {
  id: string;
  name: string;
  title: string;
  email: string;
  department: string | null;
  role: Role;
  status: Status;
};

export const seedDepartments: Department[] = [
  { id: "d1", name: "Engineering", head: "Aditi Rao", parent: null, status: "active" },
  { id: "d2", name: "Field Ops", head: "Rohan Mehta", parent: "Operations", status: "active" },
  { id: "d3", name: "Facilities", head: "Sarah Jenkins", parent: "Operations", status: "inactive" },
  { id: "d4", name: "Human Resources", head: "David Chen", parent: null, status: "active" },
  { id: "d5", name: "Operations", head: "Priya Shah", parent: null, status: "active" },
  { id: "d6", name: "IT", head: "Marcus Lee", parent: "Operations", status: "active" },
];

export const seedCategories: Category[] = [
  {
    id: "c1",
    name: "Laptops",
    description: "Portable computing devices assigned to individual employees.",
    customFields: { Processor: "string", RAM: "string", WarrantyMonths: "number" },
    status: "active",
  },
  {
    id: "c2",
    name: "Servers",
    description: "Datacenter infrastructure, rack-mounted compute units.",
    customFields: { RackUnit: "string", IP: "string" },
    status: "active",
  },
  {
    id: "c3",
    name: "Furniture",
    description: "Office desks, chairs, and physical space fixtures.",
    customFields: { LocationFloor: "number", Ergonomic: "boolean" },
    status: "inactive",
  },
  {
    id: "c4",
    name: "AV Equipment",
    description: "Conference room projectors, microphones, and cameras.",
    customFields: { Resolution: "string", Portable: "boolean" },
    status: "active",
  },
];

export const seedEmployees: Employee[] = [
  { id: "e1", name: "Sarah Jenkins", title: "Director of Operations", email: "s.jenkins@assetcorp.com", department: "Operations", role: "admin", status: "active" },
  { id: "e2", name: "David Chen", title: "Senior Facilities Engineer", email: "d.chen@assetcorp.com", department: "Facilities", role: "asset_manager", status: "active" },
  { id: "e3", name: "Emily Roberts", title: "Data Analyst", email: "e.roberts@assetcorp.com", department: "Engineering", role: "employee", status: "on_leave" },
  { id: "e4", name: "Michael Torres", title: "VP of Engineering", email: "m.torres@assetcorp.com", department: "Engineering", role: "dept_head", status: "active" },
  { id: "e5", name: "James Wilson", title: "Software Engineer", email: "j.wilson@assetcorp.com", department: "Engineering", role: "employee", status: "active" },
  { id: "e6", name: "Aditi Rao", title: "Engineering Manager", email: "a.rao@assetcorp.com", department: "Engineering", role: "dept_head", status: "active" },
  { id: "e7", name: "Priya Shah", title: "Operations Lead", email: "p.shah@assetcorp.com", department: "Operations", role: "employee", status: "active" },
];

/** Initials from a name, e.g. "Aditi Rao" -> "AR". */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
