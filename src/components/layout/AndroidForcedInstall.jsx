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
      height: '100dvh', // Fixed height
      width: '100vw',
      backgroundColor: '#ffffff',
      backgroundImage: 'url("https://res.cloudinary.com/fhscvc7p/image/upload/v1784714199/img-to-link/mrpgok1n4zukman7plwy.webp")',
      backgroundSize: 'cover', // Back to normal scaling
      backgroundPosition: 'top center', // Normal positioning
      backgroundRepeat: 'no-repeat',
      fontFamily: '"Inter", sans-serif',
      overflow: 'hidden', // Remove scroll completely
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      padding: '20px 16px 100px 16px', // Leave space at bottom for sticky button
      boxSizing: 'border-box'
    }}>
      
      {/* Top Section: Logo, Text, Mascot */}
      <div style={{ display: 'flex', position: 'relative', width: '100%', maxWidth: '450px', margin: '0 auto', flex: 1 }}>
        
        {/* Left Content Area */}
        <div style={{ width: '100%', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingTop: '10px' }}>
          
          {/* Logo */}
          <img 
            src="https://res.cloudinary.com/w7rytq0k/image/upload/v1785322514/img-to-link/bihseec7aigbmau4amnd.png" 
            alt="HoshiYaar Logo" 
            style={{ width: '105px', marginBottom: '8px' }} // Scaled down
          />

          {/* Badge */}
          <div style={{
            backgroundColor: '#e0e7ff',
            color: '#4338ca',
            padding: '4px 8px',
            borderRadius: '20px',
            fontSize: '10px', // Scaled down
            fontWeight: 800,
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            CBSE • Grades 6 to 8
          </div>

          {/* Headline */}
          <h1 style={{ 
            fontSize: '21px', // Scaled down
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
            fontSize: '12px', // Scaled down
            color: '#475569', 
            lineHeight: 1.3,
            fontWeight: 500,
            marginBottom: '10px',
            paddingRight: '50%' /* Adjusted padding to ensure it doesn't overlap the smaller mascot */
          }}>
            HoshiYaar turns CBSE Science into interactive stories, comics, videos, practice sessions, and visual learning experiences that kids love.
          </p>

          {/* Google Play Button */}
          <a 
            href={playStoreLink}
            className="jiggle-btn"
            style={{
              display: 'block',
              width: '140px', // Scaled down
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            <span style={{ color: '#fbbf24', fontSize: '12px' }}>★★★★★</span> 
            Loved by 500+ students
          </div>
        </div>
      </div>

      {/* Sticky Bottom Download Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid #e2e8f0',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <a 
          href={playStoreLink}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '400px',
            backgroundColor: '#1E65FA',
            color: 'white',
            textAlign: 'center',
            padding: '14px 20px',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: 800,
            textDecoration: 'none',
            borderBottom: '4px solid #0A3DAA',
            transition: 'transform 0.2s',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
          className="active:scale-95 hover:bg-blue-500"
        >
          DOWNLOAD APP
        </a>
      </div>
    </div>
    </>
  );
};

export default AndroidForcedInstall;
