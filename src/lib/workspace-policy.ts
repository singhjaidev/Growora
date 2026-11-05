export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';
export const permissions = {
  OWNER: { edit: true, assign: ['ADMIN', 'MEMBER'], manage: ['ADMIN', 'MEMBER'], leave: false },
  ADMIN: { edit: false, assign: ['MEMBER'], manage: ['MEMBER'], leave: true },
  MEMBER: { edit: false, assign: [], manage: [], leave: true },
} satisfies Record<Role, { edit: boolean; assign: Role[]; manage: Role[]; leave: boolean }>;
export const mayAssign = (actor: Role, target: Role) =>
  (permissions[actor].assign as readonly Role[]).includes(target);
export const mayManage = (actor: Role, target: Role) =>
  (permissions[actor].manage as readonly Role[]).includes(target);
