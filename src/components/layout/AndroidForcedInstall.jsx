import React from 'react';

const AndroidForcedInstall = () => {
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app";

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#ffffff', /* Plain white background */
      fontFamily: '"Inter", sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative'
    }}>
      <div style={{
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '380px'
      }}>
        {/* Mascot Area */}
        <div style={{ position: 'relative', marginBottom: '40px' }}>
          <img 
            src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100397/img-to-link/rtyoddo8fjqspbtngsri.webp" 
            alt="Hoshi Mascot" 
            style={{ 
              width: '180px', 
              height: '180px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
            }} 
          />
        </div>

        {/* Clean, Modern Text Content */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 900, 
            color: '#0f172a', 
            lineHeight: 1.2,
            marginBottom: '16px',
            letterSpacing: '-0.5px'
          }}>
            Unlock the Full<br/>
            <span style={{ color: '#2563eb' }}>Experience</span> 🚀
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#475569', 
            lineHeight: 1.6,
            fontWeight: 500,
            padding: '0 10px'
          }}>
            HoshiYaar's interactive missions and stories are best experienced on our dedicated Android app.
          </p>
        </div>

        {/* Official Google Play Badge */}
        <a 
          href={playStoreLink}
          style={{
            display: 'block',
            width: '200px', // Standard width for the badge
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <img 
            src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
            alt="Get it on Google Play"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </a>

        {/* Trust Indicator */}
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
          <span style={{ color: '#fbbf24', fontSize: '18px' }}>★★★★★</span> Loved by 100+ students
        </div>
      </div>
    </div>
  );
};

export default AndroidForcedInstall;
