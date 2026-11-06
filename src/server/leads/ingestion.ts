import 'server-only';
import { createHmac } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { getService } from '@/server/auth/service';
import { deny, lockedWorkspace, uuid } from '@/server/workspace/access';
import { leadForm, lead, leadActivity, leadReceipt } from './schema';
import { intake, revision, type Fields } from './validation';
import { intelligence, jobs } from '@/server/intelligence/schema';
import { routingPolicy, routingJobs } from '@/server/routing/schema';
import { checkBinding } from '@/server/marketing/destination';

export const publicIdValid = (id: string) => /^[a-f0-9]{48}$/.test(id);
export async function publicForm(publicId: string) {
  if (!publicIdValid(publicId)) return null;
  const [form] = await getService()
    .db.select({
      publicId: leadForm.publicId,
      name: leadForm.name,
      privacyNotice: leadForm.privacyNotice,
      retentionDays: leadForm.retentionDays,
      version: leadForm.version,
    })
    .from(leadForm)
    .where(and(eq(leadForm.publicId, publicId), eq(leadForm.enabled, true)));
  return form ?? null;
}
export async function ingest(publicId: string, key: string, f: Fields, marketingVersion?: number) {
  if (!publicIdValid(publicId)) return deny(404, 'Enquiry form unavailable.');
  if (!uuid(key)) return deny(400, 'A valid submission key is required.');
  const { formVersion, ...input } = f;
  const version = revision(formVersion);
  const data = intake(input);
  const { db, secret } = getService();
  const payloadHash = createHmac('sha256', secret)
    .update(JSON.stringify({ version, ...data }))
    .digest('hex');
  // Only the published, random identifier resolves the destination of a public request.
  const [reference] = await db
    .select({ id: leadForm.id, workspaceId: leadForm.workspaceId })
    .from(leadForm)
    .where(eq(leadForm.publicId, publicId));
  if (!reference) return deny(404, 'Enquiry form unavailable.');
  await db.transaction(async (tx) => {
    await lockedWorkspace(tx, reference.workspaceId, false);
    if (marketingVersion !== undefined) await checkBinding(tx, publicId, marketingVersion);
    const [form] = await tx
      .select()
      .from(leadForm)
      .where(and(eq(leadForm.workspaceId, reference.workspaceId), eq(leadForm.id, reference.id)))
      .for('share');
    if (!form?.enabled) return deny(404, 'Enquiry form unavailable.');
    const previous = await tx
      .select({ payloadHash: leadReceipt.payloadHash })
      .from(leadReceipt)
      .where(and(eq(leadReceipt.formId, form.id), eq(leadReceipt.key, key)));
    if (previous.length) {
      if (previous[0].payloadHash !== payloadHash)
        deny(409, 'This submission key was already used for different details.');
      return;
    }
    if (form.version !== version)
      return deny(409, 'The form has changed. Reload it and review the privacy notice.');
    const claimed = await tx
      .insert(leadReceipt)
      .values({ formId: form.id, key, payloadHash })
      .onConflictDoNothing()
      .returning({ key: leadReceipt.key });
    if (!claimed.length) {
      const [receipt] = await tx
        .select({ payloadHash: leadReceipt.payloadHash })
        .from(leadReceipt)
        .where(and(eq(leadReceipt.formId, form.id), eq(leadReceipt.key, key)));
      if (receipt.payloadHash !== payloadHash)
        deny(409, 'This submission key was already used for different details.');
      return;
    }
    const [created] = await tx
      .insert(lead)
      .values({
        ...data,
        workspaceId: form.workspaceId,
        sourceFormId: form.id,
        consentNotice: form.privacyNotice,
        reviewAt: form.retentionDays ? new Date(Date.now() + form.retentionDays * 86400000) : null,
      })
      .returning({ id: lead.id });
    await tx
      .insert(leadActivity)
      .values({ workspaceId: form.workspaceId, leadId: created.id, action: 'RECEIVED' });
    await tx.insert(intelligence).values({ workspaceId: form.workspaceId, leadId: created.id });
    await tx
      .insert(jobs)
      .values({ workspaceId: form.workspaceId, leadId: created.id, generation: 1 });
    const [routing] = await tx
      .select()
      .from(routingPolicy)
      .where(eq(routingPolicy.workspaceId, form.workspaceId));
    if (routing?.enabled && routing.strategy !== 'MANUAL') {
      await tx
        .insert(routingJobs)
        .values({ workspaceId: form.workspaceId, leadId: created.id, revision: 0 });
      await tx.update(lead).set({ routingState: 'PENDING' }).where(eq(lead.id, created.id));
    }
  });
}
