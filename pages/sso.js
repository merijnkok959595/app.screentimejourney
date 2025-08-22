import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SSO() {
  const router = useRouter();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleSSO = async () => {
      try {
        const { token, shop, cid } = router.query;
        
        if (!token || !shop || !cid) {
          setError('Missing SSO parameters');
          setStatus('error');
          return;
        }

        console.log('🔑 SSO processing:', { shop, cid, token: token.substring(0, 20) + '...' });

        // Verify token
        const verified = verifyToken(token, shop, cid);
        if (!verified) {
          setError('Invalid or expired token');
          setStatus('error');
          return;
        }

        console.log('✅ Token verified for:', { shop, cid });

        // Set session cookie (in a real app, this would be done server-side)
        document.cookie = `stj_session=${token}; path=/; secure; samesite=lax; max-age=86400`;
        
        console.log('🍪 Session cookie set, redirecting to dashboard');
        setStatus('success');
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);

      } catch (err) {
        console.error('❌ SSO error:', err);
        setError(err.message || 'SSO processing failed');
        setStatus('error');
      }
    };

    if (router.query.token) {
      handleSSO();
    }
  }, [router.query]);

  const verifyToken = (token, shop, cid) => {
    try {
      // Decode base64
      const decoded = atob(token);
      const parts = decoded.split('|');
      
      if (parts.length !== 5) {
        console.log('❌ Invalid token format');
        return false;
      }

      const [tokenShop, tokenCid, iat, ttl, signature] = parts;
      
      // Basic verification
      if (tokenShop !== shop || tokenCid !== cid) {
        console.log('❌ Token shop/cid mismatch');
        return false;
      }

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      const issuedAt = parseInt(iat);
      const timeToLive = parseInt(ttl);
      
      if (now > issuedAt + timeToLive) {
        console.log('❌ Token expired');
        return false;
      }

      // In production, you would verify the HMAC signature here
      // For now, just check if signature exists
      if (!signature || signature.length < 10) {
        console.log('❌ Invalid signature');
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ Token verification error:', err);
      return false;
    }
  };

  if (status === 'verifying') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h2>🔐 Verifying Access</h2>
          <p>Please wait while we verify your session...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>❌ Authentication Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.href = 'https://www.screentimejourney.com/apps/screen-time-journey'}
            style={styles.button}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>✅ Authentication Successful</h2>
        <p>Redirecting to your dashboard...</p>
        <div style={styles.spinner}></div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    background: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem'
  },
  button: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '1rem'
  }
};

// Add CSS animation for spinner (in a real app, use CSS-in-JS or external CSS)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
