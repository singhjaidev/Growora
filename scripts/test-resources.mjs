import { createHook } from 'node:async_hooks';
import { writeFileSync, mkdirSync } from 'node:fs';
const live = new Map();
const hook = createHook({
  init(id, type, trigger, resource) {
    if (
      ['MESSAGEPORT', 'TCPWRAP', 'TCPSERVERWRAP', 'Timeout', 'PROCESSWRAP', 'PIPEWRAP'].includes(
        type,
      )
    )
      live.set(id, { type, resource, stack: new Error().stack });
  },
  destroy(id) {
    live.delete(id);
  },
}).enable();
const timer = setTimeout(() => {
  mkdirSync('test-results/phase7', { recursive: true });
  const report = {
    pid: process.pid,
    resources: process.getActiveResourcesInfo(),
    live: [...live.values()]
      .filter((x) => !x.resource.hasRef || x.resource.hasRef())
      .map((x) => ({ type: x.type, stack: x.stack })),
  };
  writeFileSync(
    'test-results/phase7/handles-' + process.pid + '.json',
    JSON.stringify(report, null, 2),
  );
  console.log('RESOURCE_DIAGNOSTIC', process.pid, report.resources);
  hook.disable();
}, 45000);
timer.unref();
