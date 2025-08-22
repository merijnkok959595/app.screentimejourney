import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for session
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('stj_session='));
    
    if (!sessionCookie) {
      console.log('❌ No session found, redirecting to app proxy');
      window.location.href = 'https://www.screentimejourney.com/apps/screen-time-journey';
      return;
    }

    // Extract token from cookie
    const token = sessionCookie.split('=')[1];
    
    try {
      // Decode and parse token
      const decoded = atob(token);
      const parts = decoded.split('|');
      
      if (parts.length >= 2) {
        setCustomerData({
          shop: parts[0],
          customerId: parts[1],
          loginTime: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('❌ Error parsing session:', err);
    }
    
    setLoading(false);
  }, []);

  const handleLogout = () => {
    // Clear session cookie
    document.cookie = 'stj_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Redirect to store
    window.location.href = 'https://www.screentimejourney.com';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h2>Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.dashboard}>
        <header style={styles.header}>
          <h1>📱 Screen Time Journey</h1>
          <p>Customer Dashboard</p>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </header>

        <div style={styles.content}>
          <div style={styles.card}>
            <h2>👋 Welcome!</h2>
            {customerData && (
              <div style={styles.info}>
                <p><strong>Store:</strong> {customerData.shop}</p>
                <p><strong>Customer ID:</strong> {customerData.customerId}</p>
                <p><strong>Login Time:</strong> {new Date(customerData.loginTime).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div style={styles.card}>
            <h3>📊 Your Progress</h3>
            <p>Your screen time journey starts here! Track your digital wellness goals and celebrate your achievements.</p>
            
            <div style={styles.statsGrid}>
              <div style={styles.stat}>
                <h4>🎯 Goals Set</h4>
                <div style={styles.statValue}>3</div>
              </div>
              <div style={styles.stat}>
                <h4>📅 Days Active</h4>
                <div style={styles.statValue}>12</div>
              </div>
              <div style={styles.stat}>
                <h4>🏆 Achievements</h4>
                <div style={styles.statValue}>5</div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3>🎮 Quick Actions</h3>
            <div style={styles.actions}>
              <button style={styles.actionBtn}>Set New Goal</button>
              <button style={styles.actionBtn}>View Reports</button>
              <button style={styles.actionBtn}>Join Challenge</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  dashboard: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  header: {
    background: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
    textAlign: 'center',
    position: 'relative'
  },
  logoutBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem'
  },
  card: {
    background: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  info: {
    background: '#f8f9fa',
    padding: '1rem',
    borderRadius: '5px',
    marginTop: '1rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginTop: '1rem'
  },
  stat: {
    textAlign: 'center',
    padding: '1rem',
    background: '#f8f9fa',
    borderRadius: '5px'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: '0.5rem'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    flexWrap: 'wrap'
  },
  actionBtn: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem'
  }
};

// Add CSS animation for spinner
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
