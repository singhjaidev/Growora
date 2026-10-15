import * as THREE from 'three';
import { storyLead } from '@/lib/lead-story';

/** The interface is part of the physical surface, with a single restrained hierarchy. */
export function consoleTexture(view: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1000;
  const c = canvas.getContext('2d')!;
  const ink = '#242735',
    muted = '#7a7d8c',
    blue = '#5360bb';
  const text = (s: string, x: number, y: number, size = 24, color = ink, weight = 400) => {
    c.fillStyle = color;
    c.font = `${weight} ${size}px "DM Sans Variable", sans-serif`;
    c.fillText(s, x, y);
  };
  const box = (x: number, y: number, w: number, h: number, r: number, color: string) => {
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  };
  const line = (y: number) => {
    c.fillStyle = '#e7e8ed';
    c.fillRect(76, y, 1448, 2);
  };
  c.fillStyle = '#fcfcfd';
  c.fillRect(0, 0, 1600, 1000);
  const tint = c.createLinearGradient(0, 0, 1500, 1000);
  tint.addColorStop(0, '#ffffff');
  tint.addColorStop(1, '#f0f1f6');
  c.fillStyle = tint;
  c.fillRect(0, 0, 1600, 1000);
  box(78, 76, 27, 27, 8, blue);
  text('growora', 124, 104, 40, ink, 650);
  const labels = [
    'New enquiry',
    'Qualification',
    'Intent score',
    'Assigned owner',
    'Next actions',
    'Opportunity intelligence',
  ];
  text(labels[view], 1070, 103, 25, muted);
  text('↗', 1450, 108, 43, ink);
  line(153);
  box(80, 214, 108, 108, 34, '#eceef7');
  text('AM', 100, 283, 42, blue, 550);
  text('Alex Morgan', 220, 259, 48, ink, 550);
  text('Northline Studio', 221, 309, 28, muted);
  box(1260, 242, 255, 57, 28, '#eaf0e9');
  text(view === 0 ? 'New lead' : 'Qualified', 1301, 280, 26, '#4e6a53', 500);
  if (view === 0) {
    text('WEBSITE ENQUIRY', 84, 432, 23, muted, 500);
    text('“We’re ready for a website', 80, 535, 58, ink, 450);
    text('that moves our business', 80, 609, 58, ink, 450);
    text('forward.”', 80, 683, 58, ink, 450);
    text('Website redesign', 84, 798, 30, blue, 500);
    text('↗', 1440, 800, 45, blue);
  } else if (view === 1) {
    const rows = [
      ['Project', 'Website redesign'],
      ['Budget', '£5,000–£10,000'],
      ['Timeline', 'Within 30 days'],
    ];
    rows.forEach(([l, v], i) => {
      const y = 449 + i * 155;
      text(l, 84, y, 27, muted);
      text(v, 480, y + 3, 41, ink, 450);
      text('✓', 1410, y + 3, 38, '#68816b');
      if (i < 2) line(y + 56);
    });
  } else if (view === 2 || view === 5) {
    const x = 362,
      y = 595,
      r = 179;
    c.lineWidth = 17;
    c.strokeStyle = '#e3e6ef';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = blue;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(x, y, r, -Math.PI / 2, Math.PI * 2 * 0.91 - Math.PI / 2);
    c.stroke();
    c.textAlign = 'center';
    text(String(storyLead.score), x, y + 29, 139, ink, 500);
    text('INTENT SCORE', x, y + 83, 22, muted, 500);
    c.textAlign = 'left';
    if (view === 5) {
      text('QUALIFIED OPPORTUNITY', 751, 464, 23, muted, 500);
      text('£7,500', 743, 582, 105, ink, 450);
      text('Website redesign', 751, 643, 30, muted);
      box(750, 704, 52, 52, 26, '#e3e6f0');
      text('JL', 763, 740, 22, blue, 600);
      text('Jamie Lee', 826, 741, 31, ink);
      text('↗', 1435, 743, 38, blue);
    } else {
      text('HIGH INTENT', 750, 422, 24, blue, 600);
      [
        ['Budget', '+35'],
        ['Timing', '+21'],
        ['Company', '+5'],
        ['Base score', '30'],
      ].forEach(([l, v], i) => {
        text(l, 750, 503 + i * 89, 32, muted);
        text(v, 1318, 503 + i * 89, 34, ink, 500);
      });
    }
  } else if (view === 3) {
    box(82, 407, 1435, 396, 28, '#f0f1f7');
    box(132, 487, 164, 164, 82, '#dfe3f3');
    text('JL', 178, 592, 57, blue, 500);
    text('Jamie Lee', 360, 535, 72, ink, 500);
    text('Priority sales', 365, 597, 31, muted);
    text('Score ≥ 75', 1140, 542, 32, blue, 500);
    text('✓  Owner assigned', 365, 726, 32, '#527459');
    text('↗', 1400, 728, 48, blue);
  } else {
    [
      ['✓', 'First response prepared', 'Ready for the conversation'],
      ['◷', 'Follow up in 1 day', 'Remind Jamie if no reply'],
    ].forEach(([symbol, title, sub], i) => {
      const y = 403 + i * 222;
      box(82, y, 1435, 190, 22, i === 0 ? '#edeff8' : '#f2f3f6');
      text(symbol, 132, y + 104, 48, blue);
      text(title, 228, y + 82, 43, ink, 500);
      text(sub, 230, y + 135, 28, muted);
    });
    text('Nothing sent', 86, 870, 23, muted);
  }
  line(915);
  box(84, 951, 12, 12, 6, '#68816b');
  text(
    view === 0 ? 'Context captured' : view === 4 ? 'Next step ready' : 'Ready for the next step',
    113,
    970,
    24,
    muted,
  );
  text('G / 001', 1410, 970, 22, muted);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
