import React, { useState, useEffect } from 'react';
import './App.css';

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
      <header className="App-header">
        <h1>🕐 Screen Time Journey Dashboard</h1>
        <div className="customer-info">
          <h2>👋 Welcome!</h2>
          {customerData?.customerId && <p>Customer ID: {customerData.customerId}</p>}
          {customerData?.shop && <p>Store: {customerData.shop}</p>}
          <p>Login Time: {new Date(customerData?.loginTime).toLocaleString()}</p>
          <button 
            onClick={() => {
              document.cookie = 'stj_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              window.location.href = 'https://xpvznx-9w.myshopify.com';
            }}
            style={{marginTop: '10px', padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📊 Your Screen Time</h3>
            <div className="metric">
              <span className="metric-value">2h 34m</span>
              <span className="metric-label">Today</span>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>🎯 Daily Goal</h3>
            <div className="metric">
              <span className="metric-value">3h 00m</span>
              <span className="metric-label">Target</span>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>📱 Most Used App</h3>
            <div className="metric">
              <span className="metric-value">Instagram</span>
              <span className="metric-label">45 minutes</span>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>🔥 Streak</h3>
            <div className="metric">
              <span className="metric-value">7 days</span>
              <span className="metric-label">Under goal</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="primary-button">Set New Goal</button>
          <button className="secondary-button">View Weekly Report</button>
        </div>
      </main>
    </div>
  );
}

export default App;