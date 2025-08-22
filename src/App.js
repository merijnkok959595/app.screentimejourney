import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get JWT token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const shop = urlParams.get('shop');
    const customerId = urlParams.get('customer_id');

    if (!token) {
      setError('No authentication token provided');
      setLoading(false);
      return;
    }

    // Verify token with your Lambda backend
    verifyTokenAndLoadData(token, shop, customerId);
  }, []);

  const verifyTokenAndLoadData = async (token, shop, customerId) => {
    try {
      // Call your Lambda function to verify JWT and get customer data
      const response = await fetch('https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws/verify-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, shop, customer_id: customerId })
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      setCustomerData(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to verify authentication: ' + err.message);
      setLoading(false);
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
    return (
      <div className="App">
        <div className="error">
          <h2>⚠️ Authentication Error</h2>
          <p>{error}</p>
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
          <h2>Welcome, Customer {customerData?.customer_id}!</h2>
          {customerData?.email && <p>Email: {customerData.email}</p>}
          <p>Subscription: <span className="subscription-status">{customerData?.subscription_status}</span></p>
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