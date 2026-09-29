import type { PortalType } from '../types';

/**
 * Vai trò được phép vào từng portal. Backend trả vai trò trong /user/me
 * (LEARNER / INSTRUCTOR / ADMIN), không trả về quyền thay cho vai trò.
 */
const PORTAL_ROLES: Record<PortalType, string[]> = {
  learner: ['LEARNER', 'INSTRUCTOR', 'ADMIN'],
  instructor: ['INSTRUCTOR', 'ADMIN'],
  admin: ['ADMIN'],
  public_verify: [],
};

export const normalizeRoles = (roles?: string[] | null): string[] =>
  (roles ?? []).map(role => role.toUpperCase());

export const canAccessPortal = (roles: string[] | undefined, portal: PortalType): boolean => {
  const allowed = PORTAL_ROLES[portal];
  if (allowed.length === 0) return true;
  return normalizeRoles(roles).some(role => allowed.includes(role));
};

/** Portal điều hướng tới ngay sau khi đăng nhập thành công. */
export const landingPortal = (roles?: string[] | null): PortalType => {
  const owned = normalizeRoles(roles);
  if (owned.includes('ADMIN')) return 'admin';
  if (owned.includes('INSTRUCTOR')) return 'instructor';
  return 'learner';
};

/** Nhãn tiếng Việt của vai trò chính, dùng để hiển thị. */
export const primaryRoleLabel = (roles?: string[] | null): string => {
  const owned = normalizeRoles(roles);
  if (owned.includes('ADMIN')) return 'quản trị viên';
  if (owned.includes('INSTRUCTOR')) return 'giảng viên';
  if (owned.includes('LEARNER')) return 'học viên';
  return 'người dùng';
};
