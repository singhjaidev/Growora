import { ImageResponse } from 'next/og';
export const alt = 'Growora — Turn more enquiries into paying customers.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#f7f7f5',
        display: 'flex',
        flexDirection: 'column',
        padding: '65px 80px',
        color: '#14251f',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: 35, fontWeight: 700, color: '#197f82' }}>
        ↗ growora.
      </div>
      <div
        style={{ display: 'flex', marginTop: 65, fontSize: 18, letterSpacing: 3, color: '#62695e' }}
      >
        GROWORA / EVERY OPPORTUNITY CONNECTED
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
        <span>Turn more enquiries</span>
        <span style={{ color: '#197f82' }}>into paying customers.</span>
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
        CAPTURE → QUALIFY → ASSIGN → FOLLOW UP → TRACK
      </div>
    </div>,
    size,
  );
}
