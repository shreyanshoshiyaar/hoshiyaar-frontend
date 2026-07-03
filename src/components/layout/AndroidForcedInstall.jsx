import React from 'react';

const AndroidForcedInstall = () => {
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app";

  return (
    <>
    <style>
      {`
        @keyframes jiggle-reminder {
          0%, 85% { transform: scale(1) rotate(0); }
          88% { transform: scale(1.05) rotate(-3deg); }
          91% { transform: scale(1.05) rotate(3deg); }
          94% { transform: scale(1.05) rotate(-3deg); }
          97% { transform: scale(1.05) rotate(3deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .jiggle-btn {
          animation: jiggle-reminder 4s infinite;
        }
        .jiggle-btn:hover {
          animation: none;
          transform: scale(1.05);
        }
      `}
    </style>
    <div style={{
      minHeight: '100dvh',
      width: '100vw',
      backgroundImage: 'url("https://res.cloudinary.com/dcxlzfyfp/image/upload/v1783074750/img-to-link/frihzx02hlozdlpwi2dq.webp")',
      backgroundSize: 'cover',
      backgroundPosition: 'top center',
      backgroundRepeat: 'no-repeat',
      fontFamily: '"Inter", sans-serif',
      overflowX: 'hidden',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      
      {/* Top Section: Logo, Text, Mascot */}
      <div style={{ display: 'flex', position: 'relative', width: '100%', maxWidth: '450px', margin: '0 auto', flex: 1 }}>
        
        {/* Left Content Area */}
        <div style={{ width: '100%', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingTop: '10px' }}>
          
          {/* Logo */}
          <img 
            src="https://res.cloudinary.com/dcxlzfyfp/image/upload/v1778743597/img-to-link/bihseec7aigbmau4amnd.png" 
            alt="HoshiYaar Logo" 
            style={{ width: '120px', marginBottom: '8px' }}
          />

          {/* Badge */}
          <div style={{
            backgroundColor: '#e0e7ff',
            color: '#4338ca',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            CBSE • Grades 6 to 8
          </div>

          {/* Headline */}
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 900, 
            color: '#0f172a', 
            lineHeight: 1.15,
            marginBottom: '8px',
            letterSpacing: '-0.5px'
          }}>
            CBSE Science.<br/>
            <span style={{ color: '#4338ca' }}>Finally Made<br/>Fun.</span>
          </h1>

          {/* Paragraph */}
          <p style={{ 
            fontSize: '13px', 
            color: '#475569', 
            lineHeight: 1.3,
            fontWeight: 500,
            marginBottom: '12px',
            paddingRight: '45%' /* Keep text from overlapping the baked-in right mascot */
          }}>
            HoshiYaar turns CBSE Science into interactive stories, comics, videos, practice sessions, and visual learning experiences that kids love.
          </p>

          {/* Google Play Button */}
          <a 
            href={playStoreLink}
            className="jiggle-btn"
            style={{
              display: 'block',
              width: '160px',
              transition: 'transform 0.2s',
              marginBottom: '6px'
            }}
          >
            <img 
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
              alt="Get it on Google Play"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </a>

          {/* Trust Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
            <span style={{ color: '#fbbf24', fontSize: '13px' }}>★★★★★</span> 
            Loved by 500+ students
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AndroidForcedInstall;
