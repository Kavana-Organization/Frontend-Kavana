import { ImageResponse } from 'next/og';

export const alt = 'Kavana — Sistem Bimbingan Online D4 Teknik Informatika ULBI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0b1220 0%, #16243d 55%, #1e3a5f 100%)',
          padding: '64px 72px',
          color: '#e8eefc',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 18,
              background: '#3b82f6',
              fontSize: 34,
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            K
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>Kavana</span>
            <span style={{ fontSize: 20, color: '#9db4d8' }}>D4 Teknik Informatika · ULBI</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.15, letterSpacing: -1.5 }}>
            Sistem Bimbingan Online
          </span>
          <span style={{ fontSize: 30, color: '#a9c1e4', lineHeight: 1.35 }}>
            Proposal, logbook bimbingan, laporan sidang, revisi, dan jadwal sidang dalam satu
            platform.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(169,193,228,0.35)',
            paddingTop: 22,
            fontSize: 22,
            color: '#8ea8cd',
          }}
        >
          <span>kavana.my.id</span>
          <span>Universitas Logistik dan Bisnis Internasional</span>
        </div>
      </div>
    ),
    size
  );
}
