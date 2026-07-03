import React from 'react';

const AndroidForcedInstall = () => {
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.hoshiyaarlearning.app";

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100vw',
      backgroundImage: 'url("https://res.cloudinary.com/dcxlzfyfp/image/upload/v1783054926/img-to-link/dmkl9pa9fghmsfchtwsf.webp")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      fontFamily: '"Inter", sans-serif',
      overflow: 'hidden'
    }}>
      {/* Position the button over the empty white space in the image */}
      <div style={{
        position: 'absolute',
        top: '68%', /* Adjusted slightly up to perfectly center vertically in the white gap */
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '85%',
        maxWidth: '320px',
        zIndex: 10
      }}>
        <a 
          href={playStoreLink}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: '#1d4ed8',
            color: 'white',
            textDecoration: 'none',
            padding: '16px 24px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '17px',
            width: '100%',
            boxShadow: '0 8px 15px rgba(29, 78, 216, 0.4)',
            transition: 'all 0.2s',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
          </svg>
          Download App
        </a>
      </div>
    </div>
  );
};

export default AndroidForcedInstall;
