import type { UserRole } from "@/lib/types/db";

/** Normalize DB role string (handles accidental spaces). */
export function normalizeRole(role: string | null | undefined): string {
  return (role ?? "").trim();
}

export function isAdminRole(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "super_admin";
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "super_admin";
}

export function asUserRole(role: string | null | undefined): UserRole | null {
  const r = normalizeRole(role);
  if (r === "user" || r === "admin" || r === "super_admin") return r;
  return null;
}
