import fs from 'node:fs';
function edit(file, fn) { fs.writeFileSync(file, fn(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n'))); }
edit('src/components/product/dashboard.tsx', s => {
 s = s.replace("import { Logo, SectionTitle }", "import { reportingWindow, inReportingWindow, windowLabel, percentage } from '@/lib/reporting';\nimport { Logo, SectionTitle }");
 s = s.replace('  records,\n}', '  records,\n  window: suppliedWindow,\n}').replace('  records?: Lead[];', '  records?: Lead[];\n  window?: ReturnType<typeof reportingWindow>;');
 const a = s.indexOf('  const end = records'); const b = s.indexOf('  const data = records', a);
 s = s.slice(0,a) + `  const window = suppliedWindow ?? reportingWindow(records ?? [], Number(range));
  const dates = Array.from({ length: window.days }, (_, i) => new Date(window.start + i * 86400000));
  const visibleRecords = records ? inReportingWindow(records, window) : undefined;
` + s.slice(b);
 s = s.replace('records.filter(\n            (l)', 'visibleRecords!.filter(\n            (l)');
 s = s.replace('<span className="micro chart-caption">', `<details className="chart-data"><summary>View chart data</summary><table><thead><tr><th>Date (UTC)</th><th>{records ? 'Cumulative leads' : 'Sample signals'}</th></tr></thead><tbody>{dates.map((date, i) => <tr key={date.toISOString()}><td>{date.toLocaleDateString('en-GB', {timeZone:'UTC'})}</td><td>{data[i]}</td></tr>)}</tbody></table></details>
      <span className="micro chart-caption">`);
 const c = s.indexOf('  const latest = Math.max'); const d = s.indexOf('  const m = metrics',c);
 s = s.slice(0,c) + `  const window = reportingWindow(allLeads, Number(range));
  const leads = inReportingWindow(allLeads, window);
  const sources = Array.from(new Set(leads.map(lead => lead.source)));
` + s.slice(d);
 s = s.replaceAll("['Website', 'Referral', 'Google Ads', 'LinkedIn', 'Website demo']", 'sources');
 s = s.replace('sourceColors[i]', 'sourceColors[i % sourceColors.length]');
 s = s.replace("['#2b49ae', '#879aaf', '#aa8e64', '#b8bcb6', '#ddd2b8'][i]", 'sourceColors[i % sourceColors.length]');
 s = s.replace('Every opportunity. One clear picture.', '{windowLabel(window)} · Based on the latest workspace record.');
 s = s.replace('<ArrowUpRight size={13} />\n            </span>', '</span>');
 s = s.replace('<VolumeChart range={range} records={leads} />', '<VolumeChart range={range} records={leads} window={window} />');
 s = s.replace('Math.max(8, (leads.filter((l) => l.status === stage).length / leads.length) * 240)', 'percentage(leads.filter((l) => l.status === stage).length, leads.length)');
 s = s.replace('<div className="dashboard-body">', `<div className="action-register"><div><span className="kicker">NEXT CONVERSATIONS</span><h4>Give ready leads your attention.</h4></div><div>{allLeads.filter(l => l.score >= 75 && ['New', 'Qualified'].includes(l.status)).slice(0,3).map(l => <Link key={l.id} href={\`/app/leads?highlight=\${l.id}\`}><span>{l.name}<small>{l.company}</small></span><strong>{l.score}</strong><ArrowUpRight size={16}/></Link>)}{!allLeads.some(l => l.score >= 75 && ['New', 'Qualified'].includes(l.status)) && <p>No high-intent leads waiting for a first conversation.</p>}</div></div>
      <div className="dashboard-body">`);
 return s;
});
edit('src/components/app/analytics.tsx', s => {
 s = s.replace("import { ArrowDown, ArrowUpRight }", "import { ArrowUpRight }");
 s = s.replace("import { AppHeading }", "import { reportingWindow, inReportingWindow, windowLabel, percentage } from '@/lib/reporting';\nimport { AppHeading }");
 s = s.replace(/  const filtered = leads.filter\([\s\S]*?\n  \);/, '  const window = reportingWindow(leads, Number(range));\n  const filtered = inReportingWindow(leads, window);');
 s = s.replace("    ['Visitors', range === '30' ? 800 : 360],\n",'');
 s = s.replace('September 2026 · 30 days','Last 30 days').replace('20–26 Sep 2026 · 7 days','Last 7 days');
 s = s.replace('<div className="analytics-kpis">','<p className="reporting-note">{windowLabel(window)} · UTC · Based on the latest workspace record.</p>\n      <div className="analytics-kpis">');
 s = s.replace('              <ArrowUpRight size={14} />\n','');
 s = s.replace('Lead growth over time','Captured leads over time').replace('range={range} large records={filtered}', 'range={range} large records={filtered} window={window}');
 s = s.replace('DEMO FUNNEL', 'WORKSPACE COHORT').replace('`${100 - i * 16}%`','`${percentage(count, filtered.length)}%`');
 s = s.replace('                {i < 4 && <ArrowDown size={12} />}\n','');
 s = s.replace('Visitors are illustrative. Lead stages reflect your workspace.', 'Share of captured records currently at or beyond each stage. This is a snapshot, not historical conversion tracking.');
 s = s.replace(/Math.min\(\n\s*100,[\s\S]*?300,\n\s*\)/, 'percentage(value, filtered.reduce((a, l) => a + l.value, 0))');
 s = s.replace('<span>GBP</span>', '<span>Share of total value · GBP</span>');
 s = s.replace('              </tbody>', '                {!filtered.length && <tr><td colSpan={5}>No leads in this reporting period.</td></tr>}\n              </tbody>');
 return s;
});
edit('src/app/layout.tsx', s=>s.replace('<html lang="en">','<html lang="en" data-scroll-behavior="smooth">'));
edit('src/components/product/lead-capture.tsx', s=>s.replace('<br />A much smarter','<br /> A much smarter').replace('<br />\n            <span>next step.', '<br />{\' \'}\n            <span>next step.'));
