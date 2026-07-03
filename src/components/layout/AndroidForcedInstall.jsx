import React from 'react';

const AndroidForcedInstall = () => {
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app";

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundImage: 'url("https://res.cloudinary.com/dcxlzfyfp/image/upload/v1783061841/img-to-link/cdo5e0x8qeqv3zabpxyt.webp")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      fontFamily: '"Inter", sans-serif',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start', /* Changed from center to move content up */
      padding: '12vh 24px 2vh', /* Added top padding to position it correctly */
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      <div style={{
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '380px',
        maxHeight: '100%'
      }}>
        {/* Mascot Area */}
        <div style={{ position: 'relative', marginBottom: '3vh' }}>
          <img 
            src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1779100397/img-to-link/rtyoddo8fjqspbtngsri.webp" 
            alt="Hoshi Mascot" 
            style={{ 
              width: '150px', // slightly smaller to guarantee fit on tiny screens
              height: '150px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
            }} 
          />
        </div>

        {/* Clean, Modern Text Content */}
        <div style={{ textAlign: 'center', marginBottom: '3vh' }}>
          <h1 style={{ 
            fontSize: 'clamp(24px, 7vw, 32px)', // scales down if needed
            fontWeight: 900, 
            color: '#0f172a', 
            lineHeight: 1.2,
            marginBottom: '1.5vh',
            letterSpacing: '-0.5px'
          }}>
            App is <span style={{ color: '#2563eb' }}>Live</span> 🚀
          </h1>
          <p style={{ 
            fontSize: 'clamp(14px, 4vw, 16px)', 
            color: '#475569', 
            lineHeight: 1.5,
            fontWeight: 500,
            padding: '0 10px',
            margin: 0
          }}>
            HoshiYaar's interactive missions and stories are best experienced on our dedicated Android app.
          </p>
        </div>

        {/* Official Google Play Badge */}
        <a 
          href={playStoreLink}
          style={{
            display: 'block',
            width: '180px', // slightly smaller
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
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
          <span style={{ color: '#fbbf24', fontSize: '20px', letterSpacing: '2px' }}>★★★★★</span>
          <span>Loved by 100+ students</span>
        </div>
      </div>
    </div>
  );
};

export default AndroidForcedInstall;
