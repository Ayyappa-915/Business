export const ROLES = {
  OWNER: 'owner' as const,
  MANAGER: 'manager' as const,
  CASHIER: 'cashier' as const,
};

export type RoleType = typeof ROLES[keyof typeof ROLES];
