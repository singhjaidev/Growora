import type { Role } from './workspace-policy';
export const leadStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED'] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export const leadPermissions = {
  OWNER: { all: true, forms: true, assign: true, erase: true },
  ADMIN: { all: true, forms: true, assign: true, erase: true },
  MEMBER: { all: false, forms: false, assign: false, erase: false },
} satisfies Record<Role, { all: boolean; forms: boolean; assign: boolean; erase: boolean }>;
export const transitions: Record<LeadStatus, readonly LeadStatus[]> = {
  NEW: ['CONTACTED', 'QUALIFIED', 'CLOSED'],
  CONTACTED: ['QUALIFIED', 'CLOSED'],
  QUALIFIED: ['CONTACTED', 'CLOSED'],
  CLOSED: ['NEW'],
};
