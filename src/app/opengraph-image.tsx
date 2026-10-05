import { ImageResponse } from 'next/og';
export const alt = 'Growora — Good leads deserve a clear next step.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#f6f7fb',
        display: 'flex',
        flexDirection: 'column',
        padding: '65px 80px',
        color: '#252c29',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 35, fontWeight: 700, color: '#2b49ae' }}>
        ↗ growora.
      </div>
      <div
        style={{ display: 'flex', marginTop: 65, fontSize: 18, letterSpacing: 3, color: '#62695e' }}
      >
        GROWORA / THE OPPORTUNITY SYSTEM
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: 75,
          letterSpacing: -4,
          lineHeight: 1.12,
          marginTop: 25,
        }}
      >
        <span>Good leads deserve</span>
        <span style={{ color: '#2b49ae' }}>a clear next step.</span>
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 17,
          letterSpacing: 2,
          marginTop: 'auto',
          color: '#62695e',
        }}
      >
        CAPTURE → QUALIFY → SCORE → ROUTE → FOLLOW UP → CONVERT
      </div>
    </div>,
    size,
  );
}
