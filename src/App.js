import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/brand-theme.css';

function App() {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if this is the SSO endpoint
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    console.log('🌐 App loaded:', { path, search: window.location.search, href: window.location.href });
    
    if (path === '/sso') {
      console.log('🔑 SSO path detected, handling SSO flow');
      // Handle SSO flow
      handleSSO(urlParams);
    } else {
      console.log('📱 Dashboard path, checking for existing session');
      // Check for existing session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('stj_session='));
      
      console.log('🍪 Session cookie:', sessionCookie ? 'found' : 'not found');
      
      if (!sessionCookie) {
        setError('No active session. Please login through your store.');
        setLoading(false);
        return;
      }

      // Extract token from cookie and show dashboard
      const token = sessionCookie.split('=')[1];
      setCustomerData({ loginTime: new Date().toISOString() });
      setLoading(false);
    }
  }, []);

  const handleSSO = async (urlParams) => {
    try {
      const token = urlParams.get('token');
      const shop = urlParams.get('shop');
      const cid = urlParams.get('cid');

      if (!token || !shop || !cid) {
        setError('Missing SSO parameters');
        setLoading(false);
        return;
      }

      console.log('🔑 SSO processing:', { shop, cid, token: token.substring(0, 20) + '...' });

      // Verify token
      const verified = verifyToken(token, shop, cid);
      if (!verified) {
        setError('Invalid or expired token');
        setLoading(false);
        return;
      }

      console.log('✅ Token verified for:', { shop, cid });

      // Set session cookie
      document.cookie = `stj_session=${token}; path=/; secure; samesite=lax; max-age=86400`;
      
      console.log('🍪 Session cookie set, redirecting to dashboard');
      
      // Redirect to dashboard (root)
      window.location.href = '/';

    } catch (err) {
      console.error('❌ SSO error:', err);
      setError(err.message || 'SSO processing failed');
      setLoading(false);
    }
  };

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

      // Basic signature check
      if (!signature || signature.length < 32) {
        console.log('❌ Invalid signature');
        return false;
      }

      console.log('✅ Token verification passed:', { tokenShop, tokenCid, iat, ttl });
      return true;
    } catch (err) {
      console.error('❌ Token verification error:', err);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Error state:', error);
    return (
      <div className="App">
        <div className="error">
          <h2>⚠️ Authentication Error</h2>
          <p>{error}</p>
          <details style={{marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px'}}>
            <summary>Debug Info</summary>
            <pre style={{fontSize: '12px', marginTop: '10px'}}>
              Path: {window.location.pathname}{'\n'}
              Search: {window.location.search}{'\n'}
              Full URL: {window.location.href}{'\n'}
              User Agent: {navigator.userAgent}
            </pre>
          </details>
          <button onClick={() => window.location.href = 'https://www.screentimejourney.com'}>
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <img 
            src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/ChatGPT_Image_Aug_23_2025_at_11_37_50_AM.png?v=1755941892" 
            alt="Screen Time Journey Logo" 
            style={{maxHeight: '80px', marginBottom: '16px'}}
          />
          <h1 className="header-title">Screen Time Journey</h1>
          <p className="header-subtitle">Your Digital Wellness Dashboard</p>
          
          <div className="customer-info" style={{marginTop: '24px', padding: '16px', background: 'var(--brand-background)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--brand-separator)'}}>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '12px'}}>👋 Welcome!</h2>
            {customerData?.customerId && <p>Customer ID: {customerData.customerId}</p>}
            {customerData?.shop && <p>Store: {customerData.shop}</p>}
            <p>Login Time: {new Date(customerData?.loginTime).toLocaleString()}</p>
            <button 
              className="btn-secondary"
              onClick={() => {
                document.cookie = 'stj_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                window.location.href = 'https://xpvznx-9w.myshopify.com';
              }}
              style={{marginTop: '12px'}}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard">
          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📊 Your Screen Time</h3>
                <p className="card-description">Track your daily usage</p>
              </div>
              <div style={{textAlign: 'center', padding: '20px 0'}}>
                <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--brand-primary)', fontFamily: 'var(--font-heading)'}}>2h 34m</div>
                <div style={{fontSize: '0.9rem', color: 'var(--brand-text)', opacity: 0.7}}>Today</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🎯 Daily Goal</h3>
                <p className="card-description">Your target for today</p>
              </div>
              <div style={{textAlign: 'center', padding: '20px 0'}}>
                <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--brand-primary)', fontFamily: 'var(--font-heading)'}}>3h 00m</div>
                <div style={{fontSize: '0.9rem', color: 'var(--brand-text)', opacity: 0.7}}>Target</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📱 Most Used App</h3>
                <p className="card-description">Your biggest time consumer</p>
              </div>
              <div style={{textAlign: 'center', padding: '20px 0'}}>
                <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--brand-primary)', fontFamily: 'var(--font-heading)'}}>Instagram</div>
                <div style={{fontSize: '0.9rem', color: 'var(--brand-text)', opacity: 0.7}}>45 minutes</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🔥 Streak</h3>
                <p className="card-description">Days under your goal</p>
              </div>
              <div style={{textAlign: 'center', padding: '20px 0'}}>
                <div style={{fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--brand-primary)', fontFamily: 'var(--font-heading)'}}>7 days</div>
                <div style={{fontSize: '0.9rem', color: 'var(--brand-text)', opacity: 0.7}}>Under goal</div>
              </div>
            </div>
          </div>

          <hr className="separator" />

          <div style={{display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap'}}>
            <button className="btn-primary">Set New Goal</button>
            <button className="btn-secondary">View Weekly Report</button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;