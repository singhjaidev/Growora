'use client';
import { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Check,
  Eye,
  FileInput,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLocalState } from '@/components/providers';
import { AppHeading } from './shell';
import { Dialog } from '@/components/ui';
type Field = { id: string; label: string; type: string; required: boolean; options: string };
type CaptureForm = {
  id: string;
  name: string;
  status: 'Published' | 'Draft';
  views: number;
  submissions: number;
  fields: Field[];
};
const defaultFields: Field[] = [
  { id: 'name', label: 'Full name', type: 'Text', required: true, options: '' },
  { id: 'email', label: 'Work email', type: 'Email', required: true, options: '' },
  { id: 'company', label: 'Company', type: 'Text', required: false, options: '' },
  {
    id: 'service',
    label: 'Service needed',
    type: 'Select',
    required: true,
    options: 'Website redesign,Lead generation,Marketing strategy',
  },
  {
    id: 'budget',
    label: 'Project budget',
    type: 'Budget',
    required: true,
    options: 'Under £2,000,£2,000–£5,000,£5,000–£10,000,£10,000+',
  },
];
const initialForms: CaptureForm[] = [
  {
    id: 'website',
    name: 'Website enquiry',
    status: 'Published',
    views: 120,
    submissions: 12,
    fields: defaultFields,
  },
  {
    id: 'discovery',
    name: 'Discovery consultation',
    status: 'Published',
    views: 80,
    submissions: 8,
    fields: defaultFields.slice(0, 3),
  },
  {
    id: 'quote',
    name: 'Project quote',
    status: 'Draft',
    views: 0,
    submissions: 0,
    fields: [
      ...defaultFields,
      {
        id: 'details',
        label: 'Tell us about the project',
        type: 'Textarea',
        required: false,
        options: '',
      },
    ],
  },
];
export function FormsPage() {
  const [forms, setForms] = useLocalState<CaptureForm[]>('growora-forms', initialForms);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const form = forms.find((f) => f.id === selected);
  const [saved, setSaved] = useState(false);
  function update(patch: Partial<CaptureForm>) {
    setForms(forms.map((f) => (f.id === selected ? { ...f, ...patch } : f)));
    setSaved(false);
  }
  function updateField(id: string, patch: Partial<Field>) {
    if (form) update({ fields: form.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  }
  function reorder(index: number, delta: number) {
    if (!form) return;
    const fields = [...form.fields];
    const next = index + delta;
    if (next < 0 || next >= fields.length) return;
    [fields[index], fields[next]] = [fields[next], fields[index]];
    update({ fields });
  }
  return (
    <>
      <AppHeading
        eyebrow="MAKE THE FIRST HELLO COUNT"
        title={form ? form.name : 'Capture the right context.'}
        description={
          form
            ? 'A focused form, built around the information that changes your next step.'
            : 'Create considered entry points for your next opportunities.'
        }
      >
        <div className="heading-actions">
          {form ? (
            <>
              <button
                className="button small secondary"
                onClick={() => {
                  setPreview(true);
                  setSubmitted(false);
                }}
              >
                <Eye size={14} />
                Preview
              </button>
              <button className="button small" onClick={() => setSaved(true)}>
                <Check size={14} />
                {saved ? 'Changes confirmed' : 'Confirm changes'}
              </button>
            </>
          ) : (
            <button
              className="button small"
              onClick={() => {
                const id = crypto.randomUUID();
                setForms([
                  ...forms,
                  {
                    id,
                    name: 'Untitled enquiry form',
                    status: 'Draft',
                    views: 0,
                    submissions: 0,
                    fields: defaultFields.slice(0, 2),
                  },
                ]);
                setSelected(id);
              }}
            >
              <Plus size={14} />
              Create form
            </button>
          )}
        </div>
      </AppHeading>
      {form ? (
        <>
          <button className="text-button back-to-list" onClick={() => setSelected(null)}>
            <ArrowLeft size={14} />
            All forms
          </button>
          <div className="form-builder-layout">
            <div className="builder-fields">
              <div className="builder-heading">
                <h2>Form fields</h2>
                <span>{form.fields.length} fields · saved automatically</span>
              </div>
              {form.fields.map((field, i) => (
                <div className="builder-field" key={field.id}>
                  <div className="field-order">
                    <GripVertical size={15} />
                    <span>{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <details className="field-edit" open={i === 0}>
                    <summary>
                      {field.label || 'Untitled field'}{' '}
                      <span>
                        {field.type} · {field.required ? 'Required' : 'Optional'}
                      </span>
                    </summary>
                    <label>
                      Field label
                      <input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        maxLength={60}
                      />
                    </label>
                    <div className="field-controls">
                      <label>
                        Type
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value })}
                        >
                          {['Text', 'Email', 'Phone', 'Select', 'Budget', 'Textarea', 'Date'].map(
                            (t) => (
                              <option key={t}>{t}</option>
                            ),
                          )}
                        </select>
                      </label>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        />
                        Required
                      </label>
                    </div>
                    {['Select', 'Budget'].includes(field.type) && (
                      <label>
                        Options (comma separated)
                        <input
                          value={field.options}
                          onChange={(e) => updateField(field.id, { options: e.target.value })}
                        />
                      </label>
                    )}
                  </details>
                  <div className="field-actions">
                    <button
                      className="icon-button"
                      disabled={i === 0}
                      aria-label={`Move ${field.label} up`}
                      onClick={() => reorder(i, -1)}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      className="icon-button"
                      disabled={i === form.fields.length - 1}
                      aria-label={`Move ${field.label} down`}
                      onClick={() => reorder(i, 1)}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${field.label}`}
                      onClick={() =>
                        update({ fields: form.fields.filter((f) => f.id !== field.id) })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {form.fields.length === 0 && (
                <div className="empty-state">
                  <h3>A clean slate.</h3>
                  <p>Add the first field to begin your enquiry form.</p>
                </div>
              )}
              <button
                className="add-field"
                onClick={() =>
                  update({
                    fields: [
                      ...form.fields,
                      {
                        id: crypto.randomUUID(),
                        label: 'New field',
                        type: 'Text',
                        required: false,
                        options: '',
                      },
                    ],
                  })
                }
              >
                <Plus size={17} />
                Add a field
              </button>
            </div>
            <aside className="builder-settings">
              <p className="kicker">FORM SETTINGS</p>
              <label>
                Form name
                <input
                  value={form.name}
                  maxLength={80}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </label>
              <label>
                Workspace status
                <select
                  value={form.status}
                  onChange={(e) => update({ status: e.target.value as CaptureForm['status'] })}
                >
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </label>
              <div className="settings-note">
                <FileInput size={18} />
                <span>
                  Published means available within this local workspace. No external embed or submission
                  endpoint is created.
                </span>
              </div>
              <h3>Keep it considered.</h3>
              <p>Only ask for details that help your team decide what should happen next.</p>
            </aside>
          </div>
          <Dialog open={preview} onClose={() => setPreview(false)} title={form.name}>
            {submitted ? (
              <div className="form-preview-success" role="status">
                <Check size={35} />
                <h3>Your preview works.</h3>
                <p>Validation passed. This builder preview does not create a lead or send data.</p>
                <button className="text-button" onClick={() => setSubmitted(false)}>
                  Try again
                </button>
              </div>
            ) : (
              <form
                className="builder-preview"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                {form.fields.map((field) => (
                  <label key={field.id}>
                    {field.label || 'Untitled field'}
                    {field.required ? ' *' : ''}
                    {field.type === 'Textarea' ? (
                      <textarea required={field.required} />
                    ) : ['Select', 'Budget'].includes(field.type) ? (
                      <select required={field.required} defaultValue="">
                        <option value="" disabled>
                          Select an option
                        </option>
                        {field.options
                          .split(/,(?!\d{3}(?:\D|$))|\r?\n/)
                          .map((o) => o.trim())
                          .filter(Boolean)
                          .map((o, i) => (
                            <option key={`${o}-${i}`}>{o}</option>
                          ))}
                      </select>
                    ) : (
                      <input
                        required={field.required}
                        type={
                          field.type === 'Email'
                            ? 'email'
                            : field.type === 'Phone'
                              ? 'tel'
                              : field.type === 'Date'
                                ? 'date'
                                : 'text'
                        }
                      />
                    )}
                  </label>
                ))}
                <button className="button">
                  Test submission
                  <ArrowUpRight size={15} />
                </button>
                <p className="micro">LOCAL FORM PREVIEW · NO DATA SENT</p>
              </form>
            )}
          </Dialog>
        </>
      ) : (
        <div className="forms-list">
          {forms.map((f) => (
            <button className="form-list-item" key={f.id} onClick={() => setSelected(f.id)}>
              <span className="settings-icon">
                <FileInput size={23} />
              </span>
              <div className="form-list-title">
                <h2>{f.name}</h2>
                <p>
                  {f.fields.length} fields ·{' '}
                  {f.status === 'Published' ? 'Ready in this workspace' : 'Not published'}
                </p>
              </div>
              <span className={`stage-tag ${f.status === 'Published' ? 'won' : 'new'}`}>
                {f.status}
              </span>
              <div>
                <span>VIEWS</span>
                <strong>{f.views}</strong>
              </div>
              <div>
                <span>SUBMISSIONS</span>
                <strong>{f.submissions}</strong>
              </div>
              <div>
                <span>CONVERSION</span>
                <strong>{f.views ? ((f.submissions / f.views) * 100).toFixed(1) : '0'}%</strong>
              </div>
              <ArrowUpRight size={17} />
            </button>
          ))}
          <p className="micro">FORM ACTIVITY AT A GLANCE</p>
        </div>
      )}
    </>
  );
}
