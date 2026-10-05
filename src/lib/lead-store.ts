import type { Lead } from './domain';

// Repeated delivery of the same submission must never create another record.
export function insertLead(records: Lead[], lead: Lead): Lead[] {
  return records.some((record) => record.id === lead.id) ? records : [lead, ...records];
}
