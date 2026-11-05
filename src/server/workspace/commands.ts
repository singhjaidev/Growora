import { and, eq, isNull, lte } from 'drizzle-orm';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { getService } from '@/server/auth/service';
import { user } from '@/server/auth/schema';
import { permissions, mayAssign, mayManage } from '@/lib/workspace-policy';
import { workspace, membership, invitation } from './schema';
import { releaseAssignments } from '@/server/leads/service';
import {
  scoped,
  lockedWorkspace,
  record,
  memberKey,
  deny,
  unavailable,
  forbidden,
  uuid,
} from './access';

type Fields = Record<string, unknown>;
export type Actor = { id: string; email: string; sessionId: string };
function only(f: Fields, ...keys: string[]) {
  if (Object.keys(f).some((k) => !keys.includes(k))) deny(400, 'Unexpected field.');
}
function string(v: unknown, max: number, required = true) {
  if (!required && v === undefined) return '';
  if (typeof v !== 'string') return deny(400, 'Invalid field.');
  const s = v.normalize('NFC').trim();
  if ((required && !s) || s.length > max || /\p{Cc}/u.test(s))
    return deny(400, 'Check the length and content of your fields.');
  return s;
}
function business(f: Fields) {
  const name = string(f.name, 120),
    description = string(f.description, 500, false),
    industry = string(f.industry, 80, false),
    location = string(f.location, 120, false),
    website = string(f.website, 400, false);
  if (website) {
    let url;
    try {
      url = new URL(website);
    } catch {
      return deny(400, 'Enter a complete http or https website URL.');
    }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
      deny(400, 'Invalid website URL.');
  }
  return { name, description, industry, location, website };
}
const businessKeys = ['name', 'description', 'industry', 'location', 'website'];
function proposed(value: unknown) {
  if (value !== 'ADMIN' && value !== 'MEMBER') return deny(400, 'Choose a valid team role.');
  return value;
}
export async function create(actor: Actor, f: Fields) {
  only(f, ...businessKeys);
  const values = business(f);
  return getService().db.transaction(async (tx) => {
    const [w] = await tx.insert(workspace).values(values).returning({ id: workspace.id });
    await tx.insert(membership).values({ workspaceId: w.id, userId: actor.id, role: 'OWNER' });
    await record(tx, w.id, actor.id, 'workspace.created');
    return w;
  });
}
export async function manage(action: string, actor: Actor, id: string, f: Fields) {
  return scoped(actor.id, id, true, async (tx, w, role) => {
    if (action === 'settings') {
      only(f, ...businessKeys);
      if (!permissions[role].edit) return forbidden();
      await tx
        .update(workspace)
        .set({ ...business(f), updatedAt: new Date() })
        .where(eq(workspace.id, id));
    } else if (action === 'cancel') {
      only(f, 'inviteId');
      if (!uuid(f.inviteId)) return unavailable();
      if (!permissions[role].assign.length) return forbidden();
      const filter = and(
        eq(invitation.id, f.inviteId),
        eq(invitation.workspaceId, id),
        isNull(invitation.closedAt),
      );
      const [i] = await tx.select({ role: invitation.role }).from(invitation).where(filter);
      if (!i) return unavailable();
      if (!mayAssign(role, i.role)) return forbidden();
      await tx.update(invitation).set({ closedAt: new Date(), codeHash: null }).where(filter);
    } else if (action === 'leave') {
      only(f);
      if (!permissions[role].leave) return forbidden();
      await releaseAssignments(tx, id, actor.id, actor.id);
      await tx.delete(membership).where(memberKey(id, actor.id));
    } else if (action === 'role' || action === 'remove') {
      only(f, ...(action === 'role' ? ['memberId', 'role'] : ['memberId']));
      const target = string(f.memberId, 128);
      const filter = memberKey(id, target);
      const [m] = await tx.select({ role: membership.role }).from(membership).where(filter);
      if (!m) return unavailable();
      if (target === actor.id || !mayManage(role, m.role)) return forbidden();
      if (action === 'role') {
        const next = proposed(f.role);
        if (!mayAssign(role, next)) return forbidden();
        await tx.update(membership).set({ role: next, updatedAt: new Date() }).where(filter);
      } else {
        await releaseAssignments(tx, id, target, actor.id);
        await tx.delete(membership).where(filter);
      }
    } else return unavailable();
    // A former administrator's unused invitations must not revive after a later promotion.
    const departing = action === 'leave' ? actor.id : f.memberId;
    if (
      typeof departing === 'string' &&
      (action === 'remove' || action === 'leave' || (action === 'role' && f.role === 'MEMBER'))
    ) {
      await tx
        .update(invitation)
        .set({ closedAt: new Date(), codeHash: null })
        .where(
          and(
            eq(invitation.workspaceId, id),
            eq(invitation.invitedBy, departing),
            isNull(invitation.closedAt),
          ),
        );
    }
    await record(
      tx,
      w.id,
      actor.id,
      'workspace.' + action,
      typeof f.memberId === 'string'
        ? f.memberId
        : typeof f.inviteId === 'string'
          ? f.inviteId
          : undefined,
    );
  });
}
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
export async function invite(actor: Actor, id: string, f: Fields) {
  only(f, 'email', 'role');
  const email = string(f.email, 254).toLowerCase(),
    next = proposed(f.role);
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email))
    return deny(400, 'Enter one email address.');
  const token = randomBytes(32).toString('hex');
  await scoped(actor.id, id, true, async (tx, w, role) => {
    if (!mayAssign(role, next)) return forbidden();
    const [exists] = await tx
      .select({ id: user.id })
      .from(membership)
      .innerJoin(user, eq(user.id, membership.userId))
      .where(and(eq(membership.workspaceId, id), eq(user.email, email)));
    if (exists) return deny(409, 'This person is already a member.');
    const match = and(
      eq(invitation.workspaceId, id),
      eq(invitation.email, email),
      isNull(invitation.closedAt),
    );
    await tx
      .update(invitation)
      .set({ closedAt: new Date() })
      .where(and(match, lte(invitation.expiresAt, new Date())));
    const [existing] = await tx.select({ id: invitation.id }).from(invitation).where(match);
    if (existing) return deny(409, 'A pending invitation already exists.');
    const [i] = await tx
      .insert(invitation)
      .values({
        workspaceId: id,
        email,
        role: next,
        invitedBy: actor.id,
        tokenHash: digest(token),
        expiresAt: new Date(Date.now() + 7 * 86400000),
      })
      .returning({ id: invitation.id });
    await record(tx, w.id, actor.id, 'invitation.created', i.id);
  });
  const service = getService();
  const url = new URL('/join', service.origin);
  url.hash = new URLSearchParams({ token }).toString();
  try {
    await service.sendMail(
      email,
      'Growora workspace invitation',
      'Open this invitation and sign in with the invited email address.\n\n' + url.href,
      'invite',
    );
  } catch {
    return deny(503, 'Invitation saved, but delivery is unconfirmed. Revoke it before retrying.');
  }
}
export async function redeem(action: 'challenge' | 'accept', actor: Actor, f: Fields) {
  only(f, ...(action === 'challenge' ? ['token'] : ['token', 'code']));
  const invalid = () => deny(400, 'Invitation or confirmation code is unavailable.');
  if (typeof f.token !== 'string' || !/^\w{64}$/.test(f.token)) return invalid();
  const { db, secret, sendMail } = getService();
  const tokenHash = digest(f.token);
  // The random secret is the lookup key before the recipient has a membership.
  const [ref] = await db
    .select({ id: invitation.workspaceId })
    .from(invitation)
    .where(eq(invitation.tokenHash, tokenHash));
  if (!ref) return invalid();
  const code = action === 'challenge' ? String(randomInt(10000000, 100000000)) : string(f.code, 8);
  const codeHash = createHmac('sha256', secret)
    .update(tokenHash + ':' + actor.sessionId + ':' + code)
    .digest('hex');
  await db.transaction(async (tx) => {
    await lockedWorkspace(tx, ref.id, true);
    const filter = and(eq(invitation.workspaceId, ref.id), eq(invitation.tokenHash, tokenHash));
    const [i] = await tx.select().from(invitation).where(filter);
    if (!i || i.closedAt || i.expiresAt <= new Date() || i.email !== actor.email.toLowerCase())
      return invalid();
    const [issuer] = await tx
      .select({ role: membership.role })
      .from(membership)
      .where(memberKey(ref.id, i.invitedBy));
    if (!issuer || !mayAssign(issuer.role, i.role)) return invalid();
    if (action === 'challenge') {
      await tx
        .update(invitation)
        .set({ codeHash, codeSession: actor.sessionId, codeExpires: new Date(Date.now() + 600000) })
        .where(filter);
      return;
    }
    if (
      !i.codeHash ||
      !i.codeExpires ||
      i.codeExpires <= new Date() ||
      i.codeSession !== actor.sessionId ||
      !timingSafeEqual(Buffer.from(codeHash, 'hex'), Buffer.from(i.codeHash, 'hex'))
    )
      return invalid();
    await tx
      .insert(membership)
      .values({ workspaceId: ref.id, userId: actor.id, role: i.role })
      .onConflictDoNothing();
    await tx
      .update(invitation)
      .set({ closedAt: new Date(), codeHash: null, codeSession: null, codeExpires: null })
      .where(filter);
    await record(tx, ref.id, actor.id, 'invitation.accepted', i.id);
  });
  if (action === 'challenge') {
    try {
      await sendMail(
        actor.email,
        'Confirm your Growora workspace invitation',
        'Your invitation confirmation code is ' + code + '. It expires in 10 minutes.',
        'code',
      );
    } catch {
      return deny(503, 'Confirmation email delivery is unconfirmed. Request another code.');
    }
  }
  return { id: ref.id };
}
