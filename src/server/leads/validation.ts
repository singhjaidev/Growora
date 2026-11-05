import { deny, uuid } from '@/server/workspace/access';
import { leadStatuses, type LeadStatus } from '@/lib/lead-policy';
export type Fields = Record<string, unknown>;
export function only(f: Fields, keys: readonly string[]) {
  if (Object.keys(f).some((k) => !keys.includes(k))) deny(400, 'Unexpected field.');
}
export function text(value: unknown, max: number, optional = false, multiline = false) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string') return deny(400, 'Check the required fields.');
  const result = value.normalize('NFC').trim();
  const controls = multiline ? /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/ : /\p{Cc}/u;
  if ((!optional && !result) || result.length > max || controls.test(result))
    return deny(400, 'Check the length and content of your fields.');
  return result;
}
export function id(value: unknown) {
  if (!uuid(value)) return deny(400, 'Invalid identifier.');
  return value;
}
export function revision(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 1) return deny(400, 'Invalid revision.');
  return value as number;
}
export function status(value: unknown) {
  if (!leadStatuses.includes(value as LeadStatus)) return deny(400, 'Invalid lead status.');
  return value as LeadStatus;
}
export function intake(f: Fields) {
  only(f, [
    'customerName',
    'customerEmail',
    'customerPhone',
    'subject',
    'message',
    'consent',
    'company',
  ]);
  const customerName = text(f.customerName, 120),
    customerEmail = text(f.customerEmail, 254).toLowerCase(),
    customerPhone = text(f.customerPhone, 40, true),
    subject = text(f.subject, 160),
    message = text(f.message, 4000, false, true);
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(customerEmail))
    deny(400, 'Enter a valid email address.');
  if (customerPhone && !/^[+\d\s().-]{5,40}$/.test(customerPhone))
    deny(400, 'Enter a valid phone number.');
  if (f.consent !== true) deny(400, 'Please acknowledge the privacy notice.');
  if (f.company !== undefined && f.company !== '') deny(400, 'Unable to accept this enquiry.');
  return { customerName, customerEmail, customerPhone, subject, message };
}
export function formFields(f: Fields) {
  const name = text(f.name, 120),
    privacyNotice = text(f.privacyNotice, 1000, false, true);
  if (typeof f.enabled !== 'boolean') deny(400, 'Choose whether submissions are enabled.');
  const retentionDays = f.retentionDays;
  if (
    retentionDays !== null &&
    (!Number.isInteger(retentionDays) || Number(retentionDays) < 1 || Number(retentionDays) > 3650)
  )
    deny(400, 'Choose 1–3650 days or no scheduled review.');
  return {
    name,
    privacyNotice,
    enabled: f.enabled as boolean,
    retentionDays: retentionDays as number | null,
  };
}
