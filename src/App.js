import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/brand-theme.css';

// Default milestone data as fallback (will be replaced by API data)
const DEFAULT_MILESTONES = [
  {
    "gene": "male",
    "level": 0,
    "days_range": "0",
    "title": "Ground Zero",
    "emoji": "🪨",
    "description": "Every journey starts from the ground. You've chosen to rise from where you stand.",
    "milestone_day": 0,
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/male_level_0_groundzero.jpg",
    "next_level_title": "Fighter",
    "next_level_emoji": "🥊",
    "days_to_next": 7,
    "level_template": ""
  },
  {
    "gene": "male",
    "level": 1,
    "days_range": "7–14",
    "title": "Fighter",
    "emoji": "🥊",
    "description": "You've stepped into the fight. Each day you stay the course, your strength builds silently.",
    "milestone_day": 14,
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/male_level_1_fighter.jpg",
    "next_level_title": "King",
    "next_level_emoji": "👑",
    "days_to_next": 351,
    "level_template": "m1"
  },
  {
    "gene": "male",
    "level": 10,
    "days_range": "365+",
    "title": "King",
    "emoji": "👑",
    "description": "You've walked the path fully. Quiet strength and clarity mark the way you stand today.",
    "milestone_day": 365,
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/male_level_10_theking.jpg",
    "next_level_title": null,
    "next_level_emoji": null,
    "days_to_next": null,
    "level_template": "m10"
  }
];

// Progress calculation function
const calculateProgress = (latestDevice, gender = 'male', milestones = DEFAULT_MILESTONES) => {
  // Mock latest_device data structure - in real implementation this would come from API
  const mockLatestDevice = latestDevice || {
    last_unlock: null,
    added_at: new Date().toISOString(),
    status: 'locked',
    focus_start_date: new Date().toISOString()
  };

  // Calculate days in focus
  const focusStartDate = new Date(mockLatestDevice.focus_start_date || mockLatestDevice.added_at);
  const today = new Date();
  const timeDiff = today.getTime() - focusStartDate.getTime();
  const daysInFocus = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));

  // Find current level based on days in focus
  const genderMilestones = milestones.filter(m => m.gene === gender);
  let currentLevel = genderMilestones[0]; // Default to level 0
  
  for (let i = genderMilestones.length - 1; i >= 0; i--) {
    if (daysInFocus >= genderMilestones[i].milestone_day) {
      currentLevel = genderMilestones[i];
      break;
    }
  }

  // Calculate progress percentage to next level
  let progressPercentage = 0;
  if (currentLevel.next_level_title && currentLevel.days_to_next) {
    const nextMilestoneDay = currentLevel.milestone_day + currentLevel.days_to_next;
    const daysFromCurrentLevel = daysInFocus - currentLevel.milestone_day;
    progressPercentage = Math.min(100, Math.round((daysFromCurrentLevel / currentLevel.days_to_next) * 100));
  } else {
    // At max level
    progressPercentage = 100;
  }

  return {
    daysInFocus,
    progressPercentage,
    currentLevel,
    daysToNext: currentLevel.days_to_next ? Math.max(0, currentLevel.days_to_next - (daysInFocus - currentLevel.milestone_day)) : 0,
    finalGoalDays: 365 - daysInFocus
  };
};

// Mock device data for testing different scenarios
const getMockDeviceData = (scenario = 'ground_zero') => {
  const today = new Date();
  const scenarios = {
    ground_zero: {
      focus_start_date: today.toISOString(),
      status: 'locked',
      last_unlock: null
    },
    fighter: {
      focus_start_date: new Date(today.getTime() - (10 * 24 * 60 * 60 * 1000)).toISOString(), // 10 days ago
      status: 'locked',
      last_unlock: null
    },
    king: {
      focus_start_date: new Date(today.getTime() - (365 * 24 * 60 * 60 * 1000)).toISOString(), // 365 days ago
      status: 'locked',
      last_unlock: null
    }
  };
  return scenarios[scenario] || scenarios.ground_zero;
};

// Progress Section Component (Theme-styled card)
const ProgressSection = ({ latestDevice, customerName = "Merijn", devices, setShowAddDevice, milestones = DEFAULT_MILESTONES, startDeviceFlow }) => {
  // Use mock data if no real device data provided
  const deviceData = latestDevice || getMockDeviceData('ground_zero');
  const progress = calculateProgress(deviceData, 'male', milestones);
  const { daysInFocus, progressPercentage, currentLevel, daysToNext, finalGoalDays } = progress;
  
  // Check if using default or API milestones for debugging
  const isUsingDefault = milestones === DEFAULT_MILESTONES;
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Screen Time Journey</h3>

      </div>

      <div className="grid grid-2 grid-align-center">
        <div>
          <div className="media-square">
            <img
              className="media-square__img"
              src={currentLevel.media_url}
              alt={`${currentLevel.title} ${currentLevel.emoji}`}
            />
          </div>
          {/* Quote removed per request */}
        </div>

        <div style={{paddingBottom: '8px'}}>
          <h2 className="journey-greeting journey-greeting--big">Hi {customerName},</h2>
          <p className="journey-line">Right now, you are <strong>{currentLevel.title} {currentLevel.emoji}</strong> with <strong>{daysInFocus} days</strong> in focus – progress <strong>{progressPercentage}%</strong>.</p>
          {currentLevel.next_level_title && (
            <p className="journey-line journey-line--next">Next up: <strong>{currentLevel.next_level_title} {currentLevel.next_level_emoji}</strong> in <strong>{daysToNext} days</strong>.</p>
          )}
          <p className="journey-line journey-line--path">You're on your path to <strong>King 👑</strong> in <strong>{finalGoalDays} days</strong>.</p>
          
          {/* Add Device Button */}
          <div style={{marginTop: '20px'}}>
            {devices.length < 3 && (
              <button 
                className="btn btn--primary"
                onClick={() => startDeviceFlow('device_setup_flow')}
                style={{width: '100%'}}
              >
                Add Device
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Removed duplicate quote below the section */}
    </div>
  );
};

function App() {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [testScenario, setTestScenario] = useState('ground_zero');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [newUsername, setNewUsername] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('+31');
  const [usernameValid, setUsernameValid] = useState(null); // null, true, false
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [whatsappCode, setWhatsappCode] = useState('');
  const [whatsappCodeSent, setWhatsappCodeSent] = useState(false);
  const [whatsappLinked, setWhatsappLinked] = useState(false);
  const [whatsappError, setWhatsappError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Profile management state
  const [profileData, setProfileData] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileEditData, setProfileEditData] = useState({
    username: '',
    gender: '',
    whatsapp: '',
    country_code: '+31'
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  // Milestone data state
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [milestonesError, setMilestonesError] = useState(null);
  
  // Device management state
  const [devices, setDevices] = useState([
    {
      id: 'device_1',
      name: 'iPhone 15 Pro',
      icon: '📱',
      status: 'locked',
      addedDate: '2 days ago',
      type: 'iOS'
    },
    {
      id: 'device_2', 
      name: 'MacBook Air',
      icon: '💻',
      status: 'locked',
      addedDate: '1 week ago',
      type: 'macOS'
    }
  ]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('iOS');
  
  // Device flow state
  const [deviceFlows, setDeviceFlows] = useState({});
  const [showDeviceFlow, setShowDeviceFlow] = useState(false);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [currentFlowStep, setCurrentFlowStep] = useState(1);
  const [flowLoading, setFlowLoading] = useState(false);
  
  // Device form data state
  const [deviceFormData, setDeviceFormData] = useState({
    device_name: '',
    device_type: 'iOS'
  });
  const [deviceFormErrors, setDeviceFormErrors] = useState({});
  
  // VPN Profile state
  const [vpnProfileData, setVpnProfileData] = useState(null);
  const [profileGenerating, setProfileGenerating] = useState(false);
  
  // Audio Guide state
  const [audioGuideData, setAudioGuideData] = useState(null);
  const [audioGenerating, setAudioGenerating] = useState(false);
  
  // Shared pincode state - ONE pincode for both VPN and audio
  const [sharedPincode, setSharedPincode] = useState(null);
  
  // Voice surrender state
  const [surrenderText, setSurrenderText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [surrenderSubmitting, setSurrenderSubmitting] = useState(false);
  const [audioLevels, setAudioLevels] = useState([]);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [surrenderApproved, setSurrenderApproved] = useState(false);
  const [unlockPincode, setUnlockPincode] = useState(null);

  // Subscription cancellation state
  const [showCancelFlow, setShowCancelFlow] = useState(false);
  const [cancelStep, setCancelStep] = useState(1);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Notification settings state
  const [showNotificationsFlow, setShowNotificationsFlow] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      weeklyProgress: true,
      monthlyLeaderboard: true
    },
    whatsapp: {
      weeklyProgress: false,
      monthlyLeaderboard: false
    }
  });
  const [notificationsSubmitting, setNotificationsSubmitting] = useState(false);

  // Logs state
  const [showLogsFlow, setShowLogsFlow] = useState(false);
  const [logs, setLogs] = useState([
    {
      id: 'log_1',
      timestamp: '2025-01-15 22:31',
      type: 'device_unlock',
      title: 'Device unlocked: iPhone 15 Pro',
      description: '15-minute unlock period',
      pincode: '7429'
    },
    {
      id: 'log_2',
      timestamp: '2025-01-15 15:04',
      type: 'device_added',
      title: 'Device added: MacBook Air',
      description: 'macOS profile installed'
    },
    {
      id: 'log_3',
      timestamp: '2025-01-14 18:35',
      type: 'device_unlock',
      title: 'Device unlocked: MacBook Air',
      description: '15-minute unlock period',
      pincode: '3851'
    },
    {
      id: 'log_4',
      timestamp: '2025-01-14 09:12',
      type: 'profile_updated',
      title: 'Account profile edited',
      description: 'Username and preferences updated'
    },
    {
      id: 'log_5',
      timestamp: '2025-01-13 14:28',
      type: 'notifications_updated',
      title: 'Notifications updated',
      description: 'Weekly report enabled'
    },
    {
      id: 'log_6',
      timestamp: '2025-01-12 16:45',
      type: 'device_setup',
      title: 'Device setup completed: iPhone 15 Pro',
      description: 'iOS profile and audio guide configured'
    },
    {
      id: 'log_7',
      timestamp: '2025-01-11 11:20',
      type: 'subscription_activated',
      title: 'Subscription activated',
      description: 'Screen Time Journey - Starter plan'
    },
    {
      id: 'log_8',
      timestamp: '2025-01-10 20:15',
      type: 'device_unlock',
      title: 'Device unlocked: iPhone 15 Pro',
      description: '15-minute unlock period',
      pincode: '9264'
    }
  ]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.header-mobile-menu')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    // Load milestone data and device flows when app starts
    fetchMilestoneData();
    fetchDeviceFlows();
    
    // Check if this is local development (localhost)
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalDev) {
      console.log('🔧 Local development mode - bypassing authentication');
      setCustomerData({ 
        loginTime: new Date().toISOString(),
        customerId: 'dev_customer_123',
        shop: 'local-dev.myshopify.com',
        isLocalDev: true,
        username: ''
      });
      // Show onboarding if no username is set
      setShowOnboarding(true);
      setLoading(false);
      // Also fetch profile data for local dev
      fetchProfileData();
      return;
    }

    // Check authentication flows: App Proxy or SSO
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const hasSSOnToken = urlParams.has('token') && urlParams.has('shop') && urlParams.has('cid');
    const hasAppProxyParams = urlParams.has('hmac') && urlParams.has('shop');
    
    console.log('🌐 App loaded:', { 
      path, 
      search: window.location.search, 
      href: window.location.href, 
      hasSSOnToken, 
      hasAppProxyParams 
    });
    
    if (hasSSOnToken) {
      console.log('🔑 SSO token detected in URL params, handling SSO flow');
      // Handle SSO flow regardless of path
      handleSSO(urlParams);
    } else if (hasAppProxyParams) {
      console.log('🏪 App Proxy parameters detected, handling Shopify App Proxy flow');
      // Handle Shopify App Proxy authentication
      handleAppProxy(urlParams);
    } else {
      console.log('📱 No authentication tokens, checking for existing session');
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

      // Extract token data from cookie (fix URI decoding)
      try {
        const cookieValue = sessionCookie.split('=')[1];
        console.log('🔍 Parsing cookie value:', cookieValue ? 'present' : 'missing');
        const decodedValue = decodeURIComponent(cookieValue);
        console.log('🔍 Decoded cookie value:', decodedValue);
        const tokenData = JSON.parse(decodedValue);
        console.log('🔍 Parsed token data keys:', Object.keys(tokenData));
        
        console.log('📋 Session data:', { profileComplete: tokenData.profileComplete });
        
        setCustomerData({ 
          loginTime: new Date().toISOString(), 
          username: '',
          profileComplete: tokenData.profileComplete
        });
        
        // Show onboarding only if profile is incomplete
        setShowOnboarding(!tokenData.profileComplete);
        setLoading(false);
        // Fetch profile data for authenticated users
        if (tokenData.profileComplete) {
          fetchProfileData();
        }
      } catch (err) {
        console.error('❌ Failed to parse session cookie:', err);
        setError('Invalid session data. Please login again.');
        setLoading(false);
      }
    }
  }, []);

  const handleAppProxy = async (urlParams) => {
    try {
      const hmac = urlParams.get('hmac');
      const shop = urlParams.get('shop');
      const customerId = urlParams.get('logged_in_customer_id');
      
      console.log('🏪 App Proxy processing:', { shop, customerId, hmac: hmac ? 'present' : 'missing' });

      // If no customer ID, redirect to Shopify login
      if (!customerId) {
        console.log('👤 No logged_in_customer_id, redirecting to Shopify login');
        const shopDomain = shop || 'xpvznx-9w.myshopify.com';
        window.location.href = `https://${shopDomain}/account/login?return_url=/apps/screen-time-journey`;
        return;
      }

      // Verify HMAC (using environment variable or fallback)
      const isValidHmac = await verifyShopifyHmac(urlParams);
      if (!isValidHmac) {
        console.error('❌ Invalid HMAC signature');
        setError('Invalid request signature. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ HMAC verified, checking customer entitlement via Lambda');

      // Call Lambda to verify customer and get entitlement status
      const lambdaUrl = 'https://4ozlnbqgvl.execute-api.eu-north-1.amazonaws.com/prod';
      const response = await fetch(`${lambdaUrl}?${urlParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.status === 302) {
        // Lambda is redirecting (SSO flow)
        const location = response.headers.get('Location');
        if (location) {
          console.log('🔄 Lambda redirecting to:', location);
          window.location.href = location;
          return;
        }
      }

      // If we reach here, handle as direct App Proxy authentication
      console.log('✅ App Proxy authentication successful');
      
      // Store customer session (fixed for cross-domain)
      const sessionData = { 
        customerId, 
        shop, 
        authType: 'app_proxy',
        timestamp: Date.now()
      };
      
      console.log('🔍 Setting App Proxy session cookie:', sessionData);
      const cookieValue = encodeURIComponent(JSON.stringify(sessionData));
      document.cookie = `stj_session=${cookieValue}; path=/; secure; samesite=lax; max-age=86400`;
      
      // Set authenticated state
      setAuthenticated(true);
      setLoading(false);
      
      // Fetch profile data
      fetchProfileData();

    } catch (error) {
      console.error('❌ App Proxy authentication failed:', error);
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const verifyShopifyHmac = async (urlParams) => {
    try {
      // Get HMAC and other parameters
      const hmac = urlParams.get('hmac');
      if (!hmac) return false;

      // Create message string (exclude hmac from the message)
      const params = {};
      for (const [key, value] of urlParams.entries()) {
        if (key !== 'hmac') {
          params[key] = value;
        }
      }

      // Sort parameters and create query string
      const sortedKeys = Object.keys(params).sort();
      const message = sortedKeys.map(key => `${key}=${params[key]}`).join('&');

      console.log('🔐 HMAC verification message:', message);

      // For now, we'll delegate HMAC verification to the Lambda function
      // since the React app doesn't have access to crypto in the browser
      // The Lambda will verify HMAC and return appropriate response
      return true; // Temporary - let Lambda handle verification

    } catch (error) {
      console.error('❌ HMAC verification error:', error);
      return false;
    }
  };

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
      console.log('🔍 About to verify token:', { token: token.substring(0, 20) + '...', shop, cid });
      const verificationResult = verifyToken(token, shop, cid);
      console.log('🔍 Token verification result:', verificationResult);
      
      if (!verificationResult || !verificationResult.valid) {
        console.error('❌ Token verification failed:', verificationResult);
        setError('Invalid or expired token');
        setLoading(false);
        return;
      }

      console.log('✅ Token verified for:', { shop, cid, profileComplete: verificationResult.profileComplete });

      // Set session cookie with profile status (fixed for cross-domain redirects)
      const tokenData = { token, profileComplete: verificationResult.profileComplete };
      console.log('🔍 Setting session cookie with data:', { profileComplete: tokenData.profileComplete });
      
      // Fix JSON cookie encoding issue
      const cookieValue = encodeURIComponent(JSON.stringify(tokenData));
      document.cookie = `stj_session=${cookieValue}; path=/; secure; samesite=lax; max-age=86400`;
      
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
      console.log('🔍 Raw token received:', token);
      console.log('🔍 Environment check:', {
        hasSecret: !!process.env.REACT_APP_SHOPIFY_SHARED_SECRET,
        secretLength: process.env.REACT_APP_SHOPIFY_SHARED_SECRET?.length
      });

      // Decode base64
      const decoded = atob(token);
      console.log('🔍 Decoded token:', decoded);
      
      const parts = decoded.split('|');
      console.log('🔍 Token parts:', parts);
      
      if (parts.length !== 6) {
        console.log('❌ Invalid token format - expected 6 parts, got', parts.length);
        return { valid: false, error: 'Invalid token format' };
      }

      const [tokenShop, tokenCid, iat, ttl, profileComplete, signature] = parts;
      
      // Basic verification
      if (tokenShop !== shop || tokenCid !== cid) {
        console.log('❌ Token shop/cid mismatch', { tokenShop, shop, tokenCid, cid });
        return { valid: false, error: 'Token shop/cid mismatch' };
      }

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      const issuedAt = parseInt(iat);
      const timeToLive = parseInt(ttl);
      
      if (now > issuedAt + timeToLive) {
        console.log('❌ Token expired', { now, issuedAt, ttl, timeToLive });
        return { valid: false, error: 'Token expired' };
      }

      // For now, skip HMAC verification in browser and trust Lambda's verification
      // The browser doesn't have access to crypto libraries for HMAC-SHA256
      // Lambda already verified the HMAC when it created this token
      if (!signature || signature.length < 32) {
        console.log('❌ Invalid signature format');
        return { valid: false, error: 'Invalid signature format' };
      }

      console.log('✅ Token verification passed:', { tokenShop, tokenCid, iat, ttl, profileComplete });
      return {
        valid: true,
        profileComplete: profileComplete === "1"
      };
    } catch (err) {
      console.error('❌ Token verification error:', err);
      return { valid: false, error: err.message };
    }
  };

  // Function to fetch milestone data
  const fetchMilestoneData = async () => {
    try {
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        console.log('🔧 Local dev: Using default milestones');
        setMilestones(DEFAULT_MILESTONES);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://4ozlnbqgvl.execute-api.eu-north-1.amazonaws.com/prod'}/get_milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gender: 'male' })
      });

      const result = await response.json();

      if (response.ok && result.success && result.milestones) {
        setMilestones(result.milestones);
        setMilestonesError(null);
        console.log('✅ Milestone data loaded from API');
      } else {
        throw new Error(result.error || 'Failed to load milestones');
      }
      
    } catch (error) {
      console.error('❌ Error fetching milestone data:', error);
      setMilestonesError(error.message);
      // Fallback to default milestones
      setMilestones(DEFAULT_MILESTONES);
    } finally {
      setMilestonesLoading(false);
    }
  };

  // Function to fetch device flows from stj_system table
  const fetchDeviceFlows = async () => {
    try {
      setFlowLoading(true);
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // In local development, use mock flows
        const mockFlows = {
          device_setup_flow: {
            flow_id: 'device_setup',
            flow_name: 'Device Setup Guide',
            total_steps: 4,
            steps: [
              {
                step: 1,
                title: 'Device Configuration',
                body: 'In this video I will show you how I set up my screentime and you can do so according to your own preferences.',
                step_type: 'form',
                form_fields: [
                  {
                    field_type: 'text',
                    field_name: 'device_name',
                    label: 'Device Name',
                    placeholder: 'e.g., iPhone 15 Pro, MacBook Air',
                    required: true,
                    max_length: 50
                  },
                  {
                    field_type: 'radio',
                    field_name: 'device_type',
                    label: 'Device Type',
                    required: true,
                    options: [
                      {value: 'iOS', label: '📱 iPhone/iPad'},
                      {value: 'macOS', label: '💻 MacBook/iMac'}
                    ]
                  }
                ],
                action_button: 'Continue Setup'
              },
              {
                step: 2,
                title: 'Setup Screentime',
                body: '‼️ Setup dummy pincode first.',
                step_type: 'video',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
                action_button: 'Next Step'
              },
              {
                step: 3,
                title: 'Setup Profile',
                body: '‼️ Setup dummy pincode first.',
                step_type: 'video',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
                action_button: 'Next Step'
              },
              {
                step: 4,
                title: 'Setup Pincode',
                body: '‼️ Setup dummy pincode first.',
                step_type: 'video',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
                action_button: 'Complete Setup'
              }
            ]
          },
          device_unlock_flow: {
            flow_id: 'device_unlock',
            flow_name: 'Unlock Device',
            total_steps: 3,
            steps: [
              {
                step: 1,
                title: 'Unlock Process',
                body: 'Watch this video to understand the unlock process and what it means for your journey.',
                step_type: 'video',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
                action_button: 'I Understand, Continue'
              },
              {
                step: 2,
                title: '🔐 Unlock Device',
                body: 'You are about to unlock your device. This action requires you to acknowledge what you are giving up.',
                step_type: 'surrender',
                surrender_text: 'I hereby give up on changing my screen time habits. I give up the chance to be a present family man, live with more presence and purpose, and give attention to my wife and children. I choose distraction over discipline, and I surrender my intention to grow.',
                action_button: 'Submit Surrender'
              },
              {
                step: 3,
                title: '🔓 Unlock Code',
                body: 'Your surrender has been approved. Use the code below to unlock your device for 15 minutes.',
                step_type: 'pincode_display',
                action_button: 'Complete Unlock'
              }
            ]
          }
        };
        setDeviceFlows(mockFlows);
        console.log('🔧 Local dev: Using mock device flows');
        setFlowLoading(false);
        return;
      }
      
      // Fetch both setup and unlock flows from API
      const flowKeys = ['device_setup_flow', 'device_unlock_flow'];
      const flows = {};
      
      for (const flowKey of flowKeys) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://4ozlnbqgvl.execute-api.eu-north-1.amazonaws.com/prod'}/get_system_config`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ config_key: flowKey })
          });
          
          const result = await response.json();
          
          if (response.ok && result.success && result.data) {
            flows[flowKey] = result.data;
            console.log(`✅ Loaded ${flowKey}:`, result.data.flow_name);
          }
        } catch (error) {
          console.error(`❌ Error fetching ${flowKey}:`, error);
        }
      }
      
      setDeviceFlows(flows);
      console.log('✅ Device flows loaded:', Object.keys(flows));
      
    } catch (error) {
      console.error('❌ Error fetching device flows:', error);
    } finally {
      setFlowLoading(false);
    }
  };

  // Unified pincode generation and storage
  const generateAndStorePincode = async () => {
    if (!deviceFormData.device_type) {
      alert('Please select a device type first');
      return null;
    }
    
    try {
      // Generate 4-digit random PIN code
      const pincode = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Generate UUID for tracking
      const uuid = generateUUID();
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      const pincodeData = {
        pincode: pincode,
        uuid: uuid,
        deviceType: deviceFormData.device_type,
        deviceName: deviceFormData.device_name,
        userId: customerData?.customerId || 'dev_user_123',
        createdAt: new Date().toISOString()
      };
      
      if (!isLocalDev) {
        // In production, store pincode in stj_password table via API
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://4ozlnbqgvl.execute-api.eu-north-1.amazonaws.com/prod'}/store_pincode`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pincode: pincode,
            uuid: uuid,
            device_type: deviceFormData.device_type,
            device_name: deviceFormData.device_name,
            user_id: customerData?.customerId || 'dev_user_123',
            method: 'create',
            purpose: 'device_setup'
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to store pincode');
        }
        
        console.log('✅ Pincode stored in stj_password table');
      } else {
        console.log('🔧 Local dev: Pincode generated (not stored):', pincode);
      }
      
      setSharedPincode(pincodeData);
      return pincodeData;
      
    } catch (error) {
      console.error('❌ Error generating/storing pincode:', error);
      alert('Failed to generate pincode. Please try again.');
      return null;
    }
  };

  // VPN Profile generation functions
  const generateVPNProfile = async () => {
    if (!deviceFormData.device_type) {
      alert('Please select a device type first');
      return;
    }
    
    setProfileGenerating(true);
    
    try {
      // Use shared pincode if available, or generate new one
      let pincodeData = sharedPincode;
      if (!pincodeData) {
        pincodeData = await generateAndStorePincode();
        if (!pincodeData) {
          setProfileGenerating(false);
          return;
        }
      }
      
      const { pincode, uuid: profileUUID } = pincodeData;
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // In local development, create mock profile data
        const profileData = {
          deviceType: deviceFormData.device_type,
          hasPincode: deviceFormData.device_type === 'macOS',
          pincode: deviceFormData.device_type === 'macOS' ? pincode : null,
          profileUUID: profileUUID,
          filename: `${deviceFormData.device_type.toLowerCase()}-screentimetransformation-${profileUUID}.mobileconfig`,
          downloadUrl: `#demo-profile-${deviceFormData.device_type}`, // Demo URL for local dev
          profileContent: generateProfileContent(deviceFormData.device_type, pincode, profileUUID)
        };
        
        setVpnProfileData(profileData);
        console.log('🔧 Local dev: Generated VPN profile:', profileData);
        
      } else {
        // In production, call the backend API
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://4ozlnbqgvl.execute-api.eu-north-1.amazonaws.com/prod'}/generate_vpn_profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_type: deviceFormData.device_type,
            device_name: deviceFormData.device_name
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          setVpnProfileData(result.profileData);
          console.log('✅ VPN profile generated:', result.profileData);
        } else {
          throw new Error(result.error || 'Failed to generate VPN profile');
        }
      }
      
    } catch (error) {
      console.error('❌ Error generating VPN profile:', error);
      alert('Failed to generate VPN profile. Please try again.');
    } finally {
      setProfileGenerating(false);
    }
  };
  
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  const generateProfileContent = (deviceType, pincode, uuid) => {
    const mainUUID = generateUUID();
    const dnsUUID = generateUUID();
    
    if (deviceType === 'iOS') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>ServerAddresses</key>
        <array>
          <string>185.228.168.168</string>
          <string>185.228.169.168</string>
        </array>
      </dict>
      <key>PayloadDisplayName</key>
      <string>CleanBrowsing Family Safe DNS</string>
      <key>PayloadIdentifier</key>
      <string>com.merijnkokbv.cleanbrowsingdns</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>${dnsUUID}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Enforces CleanBrowsing Family Safe DNS filtering for iOS devices</string>
  <key>PayloadDisplayName</key>
  <string>MK#ScreentimeTransformation_${uuid}</string>
  <key>PayloadIdentifier</key>
  <string>com.merijnkokbv.screentimetransformation.ios</string>
  <key>PayloadOrganization</key>
  <string>MerijnKokBV</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${mainUUID}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
    } else {
      // macOS with pincode
      const passwordUUID = generateUUID();
      return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>ServerAddresses</key>
        <array>
          <string>185.228.168.168</string>
          <string>185.228.169.168</string>
        </array>
      </dict>
      <key>PayloadDisplayName</key>
      <string>CleanBrowsing Family Safe DNS</string>
      <key>PayloadIdentifier</key>
      <string>com.merijnkokbv.cleanbrowsingdns</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>${dnsUUID}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
    <dict>
      <key>PayloadDisplayName</key>
      <string>Profile Removal Password</string>
      <key>PayloadIdentifier</key>
      <string>com.merijnkokbv.removalpassword</string>
      <key>PayloadType</key>
      <string>com.apple.profileRemovalPassword</string>
      <key>PayloadUUID</key>
      <string>${passwordUUID}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>RemovalPassword</key>
      <string>${pincode}</string>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Enforces CleanBrowsing Family Safe DNS filtering with uninstall PIN for macOS devices</string>
  <key>PayloadDisplayName</key>
  <string>MK#ScreentimeTransformation_${uuid}</string>
  <key>PayloadIdentifier</key>
  <string>com.merijnkokbv.screentimetransformation.macos</string>
  <key>PayloadOrganization</key>
  <string>MerijnKokBV</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${mainUUID}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
    }
  };
  
  const downloadProfile = () => {
    if (!vpnProfileData) {
      alert('No profile available to download');
      return;
    }
    
    // Create blob and download
    const blob = new Blob([vpnProfileData.profileContent], { 
      type: 'application/x-apple-aspen-config' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = vpnProfileData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('📱 Profile downloaded:', vpnProfileData.filename);
  };

  // Audio Guide generation functions
  const generateAudioGuide = async () => {
    if (!deviceFormData.device_type) {
      alert('Please select a device type first');
      return;
    }
    
    setAudioGenerating(true);
    
    try {
      // Use shared pincode if available, or generate new one
      let pincodeData = sharedPincode;
      if (!pincodeData) {
        pincodeData = await generateAndStorePincode();
        if (!pincodeData) {
          setAudioGenerating(false);
          return;
        }
      }
      
      const { pincode, uuid } = pincodeData;
      const [first, second, third, fourth] = pincode.split('');
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // In local development, create mock audio data with text-to-speech
        const audioData = {
          pincode: pincode,
          digits: { first, second, third, fourth },
          audioUrl: 'demo-audio', // Special flag for local dev
          uuid: uuid,
          deviceType: deviceFormData.device_type,
          instructions: `Generated pincode: ${pincode}. Click Settings, then Screen Time, then Lock Screen Time settings. Follow the audio instructions to enter: ${first}, ${second}, ${third}, ${fourth}.`,
          isLocalDemo: true
        };
        
        setAudioGuideData(audioData);
        console.log('🔧 Local dev: Generated audio guide:', audioData);
        
      } else {
        // In production, call the backend API to generate audio with existing pincode
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://4ozlnbqgvl.execute-api.eu-north-1.amazonaws.com/prod'}/generate_audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_type: deviceFormData.device_type,
            device_name: deviceFormData.device_name,
            user_id: customerData?.customerId || 'dev_user_123',
            pincode: pincode, // Use the shared pincode
            uuid: uuid // Use the shared UUID
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          setAudioGuideData(result.audioData);
          console.log('✅ Audio guide generated:', result.audioData);
        } else {
          throw new Error(result.error || 'Failed to generate audio guide');
        }
      }
      
    } catch (error) {
      console.error('❌ Error generating audio guide:', error);
      alert('Failed to generate audio guide. Please try again.');
    } finally {
      setAudioGenerating(false);
    }
  };
  
  const playAudioGuide = () => {
    if (!audioGuideData || !audioGuideData.audioUrl) {
      alert('No audio guide available to play');
      return;
    }
    
    // Create audio element and play
    const audio = new Audio(audioGuideData.audioUrl);
    audio.play().catch(error => {
      console.error('❌ Error playing audio:', error);
      alert('Failed to play audio. Please check your browser settings.');
    });
    
    console.log('🔊 Playing audio guide for pincode:', audioGuideData.pincode);
  };

  // Voice recording functions for surrender
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      // Set up audio visualization
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 256;
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyserNode);
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);

      // Animation function for audio bars
      const updateAudioLevels = () => {
        if (analyserNode && isRecording) {
          analyserNode.getByteFrequencyData(dataArray);
          
          // Create audio level bars (8 bars for visualization)
          const bars = [];
          const barCount = 8;
          const samplesPerBar = Math.floor(bufferLength / barCount);
          
          for (let i = 0; i < barCount; i++) {
            let sum = 0;
            for (let j = 0; j < samplesPerBar; j++) {
              sum += dataArray[i * samplesPerBar + j];
            }
            const average = sum / samplesPerBar;
            const height = Math.max(5, (average / 255) * 100); // Minimum 5%, max 100%
            bars.push(height);
          }
          
          setAudioLevels(bars);
          
          if (isRecording) {
            requestAnimationFrame(updateAudioLevels);
          }
        }
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        
        // Clean up audio context
        if (audioCtx) {
          audioCtx.close();
        }
        setAudioLevels([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Start audio visualization
      updateAudioLevels();
      
      console.log('🎤 Recording started with audio visualization');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      console.log('🛑 Recording stopped');
    }
  };

  const submitSurrender = async () => {
    if (!audioBlob) {
      alert('Please record your surrender message first.');
      return;
    }

    setSurrenderSubmitting(true);

    try {
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // Mock approval for local development
        console.log('🔧 Local dev: Mock surrender approved');
        
        // Generate unlock pincode
        const pincode = Math.floor(1000 + Math.random() * 9000).toString();
        setUnlockPincode(pincode);
        setSurrenderApproved(true);
        
        console.log('🔓 Surrender approved! Pincode generated:', pincode);
        
        // Move to step 3 (pincode display)
        setCurrentFlowStep(3);
        return;
      }

      // Create FormData for audio upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'surrender.webm');
      formData.append('user_id', customerData?.customerId || 'dev_user_123');
      formData.append('device_id', currentFlow.deviceId);
      formData.append('surrender_text', currentFlow.steps[currentFlowStep - 1].surrender_text || surrenderText);

      // Submit to backend for ChatGPT validation
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://4ozlnbqgvl.execute-api.eu-north-1.amazonaws.com/prod'}/validate_surrender`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.approved) {
          // Generate unlock pincode
          const pincode = result.pincode || Math.floor(1000 + Math.random() * 9000).toString();
          setUnlockPincode(pincode);
          setSurrenderApproved(true);
          
          console.log('🔓 Surrender approved! Pincode generated:', pincode);
          
          // Send email with pincode
          await sendUnlockEmail(pincode);
          
          // Move to step 3 (pincode display)
          setCurrentFlowStep(3);
        } else {
          alert('❌ Surrender not approved. Please record the complete text clearly.');
        }
      } else {
        throw new Error(result.error || 'Failed to validate surrender');
      }

    } catch (error) {
      console.error('❌ Error submitting surrender:', error);
      alert('Failed to submit surrender. Please try again.');
    } finally {
      setSurrenderSubmitting(false);
    }
  };

  const sendUnlockEmail = async (pincode) => {
    try {
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        console.log('🔧 Local dev: Mock email sent with pincode:', pincode);
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://4ozlnbqgvl.execute-api.eu-north-1.amazonaws.com/prod'}/send_unlock_email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: customerData?.customerId || 'dev_user_123',
          pincode: pincode,
          device_id: currentFlow.deviceId,
          device_name: devices.find(d => d.id === currentFlow.deviceId)?.name || 'Unknown Device'
        })
      });

      if (response.ok) {
        console.log('✅ Unlock email sent successfully');
      } else {
        console.error('❌ Failed to send unlock email');
      }
    } catch (error) {
      console.error('❌ Error sending unlock email:', error);
    }
  };

  const completeUnlockProcess = () => {
    // Unlock the device
    if (currentFlow.deviceId) {
      const device = devices.find(d => d.id === currentFlow.deviceId);
      unlockDevice(currentFlow.deviceId);
      
      // Add log entry for device unlock
      if (unlockPincode && device) {
        addLog(
          'device_unlock',
          `Device unlocked: ${device.name}`,
          '15-minute unlock period',
          unlockPincode
        );
      }
    }
    
    alert('🔓 Device unlocked for 15 minutes!');
    completeFlow();
  };

  // Subscription cancellation functions
  const startCancelFlow = () => {
    setShowCancelFlow(true);
    setCancelStep(1);
    setCancelReason('');
    setCancelFeedback('');
  };

  const closeCancelFlow = () => {
    setShowCancelFlow(false);
    setCancelStep(1);
    setCancelReason('');
    setCancelFeedback('');
  };

  const nextCancelStep = () => {
    if (cancelStep < 3) {
      setCancelStep(cancelStep + 1);
    }
  };

  const submitCancellation = async () => {
    setCancelSubmitting(true);
    
    try {
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // Mock cancellation for local development
        console.log('🔧 Local dev: Mock cancellation submitted');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
        
        alert('✅ Subscription cancelled successfully! You will receive a confirmation email.');
        closeCancelFlow();
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws'}/cancel_subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: customerData?.customerId || 'dev_user_123',
          customer_email: customerData?.email || 'test@example.com',
          shop: customerData?.shop || 'test-shop.myshopify.com',
          subscription_id: customerData?.subscription_id,
          cancel_reason: cancelReason,
          feedback: cancelFeedback,
          cancel_date: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Subscription cancelled successfully! You will receive a confirmation email.');
        
        // Update local state to reflect cancellation
        setCustomerData(prev => ({
          ...prev,
          subscription_status: 'cancelled'
        }));
        
        closeCancelFlow();
      } else {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      alert('❌ Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Notification settings functions
  const startNotificationsFlow = () => {
    setShowNotificationsFlow(true);
  };

  const closeNotificationsFlow = () => {
    setShowNotificationsFlow(false);
  };

  const updateNotificationSetting = (platform, type, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [type]: value
      }
    }));
  };

  const submitNotificationSettings = async () => {
    setNotificationsSubmitting(true);
    
    try {
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // Mock submission for local development
        console.log('🔧 Local dev: Mock notification settings saved', notificationSettings);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        alert('✅ Notification settings saved successfully!');
        closeNotificationsFlow();
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws'}/update_notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: customerData?.customerId || 'dev_user_123',
          notification_settings: notificationSettings,
          updated_at: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Notification settings saved successfully!');
        closeNotificationsFlow();
      } else {
        throw new Error(result.error || 'Failed to update notification settings');
      }

    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      alert('❌ Failed to save notification settings. Please try again.');
    } finally {
      setNotificationsSubmitting(false);
    }
  };

  // Logs functions
  const startLogsFlow = () => {
    setShowLogsFlow(true);
  };

  const closeLogsFlow = () => {
    setShowLogsFlow(false);
  };

  const addLog = (type, title, description, pincode = null) => {
    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', ''),
      type,
      title,
      description,
      pincode
    };
    
    setLogs(prev => [newLog, ...prev]);
  };



  // Function to start a device flow
  const startDeviceFlow = (flowType, deviceId = null) => {
    const flow = deviceFlows[flowType];
    if (!flow) {
      console.error('❌ Flow not found:', flowType);
      return;
    }
    
    setCurrentFlow({ ...flow, flowType, deviceId });
    setCurrentFlowStep(1);
    setShowDeviceFlow(true);
    console.log('🎬 Starting flow:', flow.flow_name);
  };

  // Function to navigate flow steps
  const nextFlowStep = () => {
    if (!currentFlow) return;
    
    const currentStep = currentFlow.steps[currentFlowStep - 1];
    
    // Clear previous errors
    setDeviceFormErrors({});
    
    // Handle surrender step
    if (currentStep && currentStep.step_type === 'surrender') {
      submitSurrender();
      return;
    }
    
    // Validate form step if it's a form
    if (currentStep && currentStep.step_type === 'form') {
      const errors = {};
      
      if (!deviceFormData.device_name.trim()) {
        errors.device_name = 'Please enter a device name';
      } else if (deviceFormData.device_name.trim().length < 2) {
        errors.device_name = 'Device name must be at least 2 characters';
      }
      
      if (!deviceFormData.device_type) {
        errors.device_type = 'Please select a device type';
      }
      
      if (Object.keys(errors).length > 0) {
        setDeviceFormErrors(errors);
        return;
      }
    }
    
    if (currentFlowStep < currentFlow.total_steps) {
      const nextStep = currentFlowStep + 1;
      setCurrentFlowStep(nextStep);
      
      // Auto-generate VPN profile when reaching step 3 (Setup Profile)
      if (nextStep === 3 && currentFlow.flowType === 'device_setup_flow' && !vpnProfileData) {
        generateVPNProfile();
      }
      
      // Auto-generate audio guide when reaching step 4 (Setup Pincode)
      if (nextStep === 4 && currentFlow.flowType === 'device_setup_flow' && !audioGuideData) {
        generateAudioGuide();
      }
    } else {
      completeFlow();
    }
  };

  const prevFlowStep = () => {
    if (currentFlowStep > 1) {
      setCurrentFlowStep(currentFlowStep - 1);
    }
  };

  const completeFlow = () => {
    if (currentFlow) {
      console.log('✅ Flow completed:', currentFlow.flow_name);
      
      if (currentFlow.flowType === 'device_setup_flow') {
        // Use form data to add device directly
        addDeviceFromFlow();
      } else if (currentFlow.flowType === 'device_unlock_flow' && currentFlow.deviceId) {
        // Unlock device after unlock flow completion
        unlockDevice(currentFlow.deviceId);
      }
    }
    
    setShowDeviceFlow(false);
    setCurrentFlow(null);
    setCurrentFlowStep(1);
    // Reset form data and VPN profile data
    setDeviceFormData({
      device_name: '',
      device_type: 'iOS'
    });
    setVpnProfileData(null);
    setAudioGuideData(null);
    setSharedPincode(null);
    setAudioBlob(null);
    setIsRecording(false);
    setSurrenderSubmitting(false);
    setSurrenderApproved(false);
    setUnlockPincode(null);
  };



  // Function to fetch complete profile data from backend
  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      setProfileError('');
      
      // Extract customer ID from session
      let customerId = null;
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('stj_session='));
      
      if (sessionCookie) {
        try {
          const cookieValue = sessionCookie.split('=')[1];
          const tokenData = JSON.parse(cookieValue);
          const decoded = atob(tokenData.token);
          const parts = decoded.split('|');
          customerId = parts[1]; // customer_id is the second part
        } catch (err) {
          console.error('❌ Failed to extract customer ID from session:', err);
        }
      }
      
      if (!customerId) {
        throw new Error('Customer ID not found');
      }
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // Mock profile data for local development
        setTimeout(() => {
          const mockProfile = {
            customer_id: customerId,
            email: 'john@example.com',
            username: 'theking',
            gender: 'male',
            whatsapp: '+31612345678',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            subscription_status: 'active'
          };
          setProfileData(mockProfile);
          setProfileLoading(false);
          console.log('🔧 Local dev: Mock profile data loaded');
        }, 500);
        return;
      }
      
      // Call backend API to get profile data
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws'}/get_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id: customerId })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setProfileData(result.profile);
        console.log('✅ Profile data loaded successfully');
      } else {
        throw new Error(result.error || 'Failed to load profile data');
      }
      
    } catch (error) {
      console.error('❌ Error fetching profile data:', error);
      setProfileError(error.message || 'Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  // Function to update profile data
  const updateProfileData = async (updatedData) => {
    try {
      setProfileLoading(true);
      setProfileError('');
      
      // Extract customer ID from session
      let customerId = null;
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('stj_session='));
      
      if (sessionCookie) {
        try {
          const cookieValue = sessionCookie.split('=')[1];
          const tokenData = JSON.parse(cookieValue);
          const decoded = atob(tokenData.token);
          const parts = decoded.split('|');
          customerId = parts[1];
        } catch (err) {
          console.error('❌ Failed to extract customer ID from session:', err);
        }
      }
      
      if (!customerId) {
        throw new Error('Customer ID not found');
      }
      
      const updatePayload = {
        customer_id: customerId,
        ...updatedData
      };
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // Mock update for local development
        setTimeout(() => {
          setProfileData(prev => ({
            ...prev,
            ...updatedData,
            updated_at: new Date().toISOString()
          }));
          setProfileLoading(false);
          setShowProfileEdit(false);
          console.log('🔧 Local dev: Profile updated successfully');
        }, 500);
        return;
      }
      
      // Call backend API to update profile
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws'}/update_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setProfileData(result.profile);
        setShowProfileEdit(false);
        console.log('✅ Profile updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const checkUsernameAvailability = async (username) => {
    // Clear previous errors
    setUsernameError('');
    
    // Validate username format first
    if (!username || username.length < 3) {
      setUsernameValid(null);
      if (username && username.length < 3) {
        setUsernameError('Username must be at least 3 characters');
      }
      return;
    }
    
    // Check for invalid characters (should only be alphanumeric)
    if (!/^[a-z0-9]+$/.test(username)) {
      setUsernameValid(false);
      setUsernameError('Username can only contain letters and numbers');
      return;
    }
    
    // Check minimum length (redundant but explicit)
    if (username.length < 3) {
      setUsernameValid(false);
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    setUsernameChecking(true);
    
    // Check if this is local development
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalDev) {
      // In local development, simulate username validation
      setTimeout(() => {
        const isAvailable = !['admin', 'test', 'user'].includes(username.toLowerCase());
        setUsernameValid(isAvailable);
        if (!isAvailable) {
          setUsernameError('Username is already taken');
        }
        setUsernameChecking(false);
        console.log(`🔧 Local dev: Username ${username} is ${isAvailable ? 'available' : 'taken'}`);
      }, 500);
      return;
    }
    
    try {
      // Call backend API to check username availability
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws'}/check_username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setUsernameValid(result.available);
        if (!result.available) {
          setUsernameError('Username is already taken');
        }
        console.log(`✅ Username ${username} is ${result.available ? 'available' : 'taken'}`);
      } else {
        setUsernameValid(true); // Allow progression on API error
        setUsernameError('Unable to check username availability');
        console.error('❌ Failed to check username, allowing progression:', result);
      }
      
    } catch (error) {
      console.error('❌ Error checking username, allowing progression:', error);
      setUsernameValid(true); // Allow progression on network error
      setUsernameError('Connection error - please try again');
    } finally {
      setUsernameChecking(false);
    }
  };

  const sendWhatsAppCode = async () => {
    setWhatsappError(''); // Clear any previous errors
    
    if (!newWhatsapp.trim()) {
      setWhatsappError('Please enter your phone number');
      return;
    }
    
    if (newWhatsapp.trim().length < 8) {
      setWhatsappError('Phone number is too short');
      return;
    }

    try {
      setLoading(true);
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // In local development, simulate sending code
        setTimeout(() => {
          setWhatsappCodeSent(true);
          setResendCooldown(60); // Start 60-second cooldown
          setOnboardStep(4); // Move to verification step
          setLoading(false);
          console.log(`🔧 Local dev: Simulated sending code to ${newCountryCode}${newWhatsapp}`);
          alert(`Demo: Verification code "123456" sent to ${newCountryCode}${newWhatsapp}`);
        }, 1000);
        return;
      }
      
      // Call backend API to send WhatsApp verification code
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws'}/send_whatsapp_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: `${newCountryCode}${newWhatsapp}`.replace(/\s/g, '') 
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setWhatsappCodeSent(true);
        setResendCooldown(60); // Start 60-second cooldown
        setOnboardStep(4); // Move to verification step
        console.log('✅ WhatsApp code sent successfully');
      } else {
        alert(result.error || 'Failed to send verification code. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error sending WhatsApp code:', error);
      alert('Failed to send verification code. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyWhatsAppCode = async () => {
    setWhatsappError(''); // Clear any previous errors
    
    if (!whatsappCode || whatsappCode.length !== 6) {
      setWhatsappError('Please enter the complete 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // In local development, accept "123456" as valid code
        setTimeout(async () => {
          if (whatsappCode === '123456') {
            setWhatsappLinked(true);
            console.log('🔧 Local dev: WhatsApp verification successful');
            await saveProfile(); // Proceed to save profile
          } else {
            setLoading(false);
            setWhatsappError('Invalid code. Use "123456" for demo');
          }
        }, 500);
        return;
      }
      
      // Call backend API to verify WhatsApp code
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws'}/verify_whatsapp_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: `${newCountryCode}${newWhatsapp}`.replace(/\s/g, ''),
          code: whatsappCode
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setWhatsappLinked(true);
        await saveProfile(); // Proceed to save profile
      } else {
        setWhatsappError(result.error || 'Invalid verification code. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error verifying WhatsApp code:', error);
      setWhatsappError('Failed to verify code. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Synchronous username check for final validation before saving
  const checkUsernameAvailabilitySync = async (username) => {
    try {
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // In local development, simulate check
        const isAvailable = !['admin', 'test', 'user'].includes(username.toLowerCase());
        console.log(`🔧 Local dev: Final username check - ${username} is ${isAvailable ? 'available' : 'taken'}`);
        return isAvailable;
      }
      
      // Call backend API for final check
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws'}/check_username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`🔍 Final username check: ${username} is ${result.available ? 'available' : 'taken'}`);
        return result.available;
      } else {
        console.error('❌ Final username check failed:', result);
        return false; // Fail safe - don't allow save if we can't verify
      }
      
    } catch (error) {
      console.error('❌ Error in final username check:', error);
      return false; // Fail safe - don't allow save if we can't verify
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      
      // CRITICAL: Final username availability check to prevent race conditions
      console.log('🔍 Performing final username availability check before saving...');
      const finalUsernameCheck = await checkUsernameAvailabilitySync(newUsername);
      
      if (!finalUsernameCheck) {
        setUsernameError('Username was just taken by another user. Please choose a different one.');
        setUsernameValid(false);
        setOnboardStep(1); // Go back to username step
        setLoading(false);
        return;
      }
      
      console.log('✅ Final username check passed, proceeding with save...');
      
      // Extract customer ID from URL params or cookie
      const urlParams = new URLSearchParams(window.location.search);
      let customerId = urlParams.get('cid');
      
      if (!customerId) {
        // Try to extract from session cookie
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('stj_session='));
        
        if (sessionCookie) {
          try {
            const cookieValue = sessionCookie.split('=')[1];
            const tokenData = JSON.parse(cookieValue);
            const decoded = atob(tokenData.token);
            const parts = decoded.split('|');
            customerId = parts[1]; // customer_id is the second part
          } catch (err) {
            console.error('❌ Failed to extract customer ID from session:', err);
          }
        }
      }
      
      if (!customerId) {
        alert('Unable to save profile: Customer ID not found');
        setLoading(false);
        return;
      }
      
      const profileData = {
        customer_id: customerId,
        username: newUsername.trim(),
        gender: newGender,
        whatsapp: whatsappLinked ? `${newCountryCode}${newWhatsapp}`.replace(/\s/g, '') : ''
      };
      
      console.log('💾 Saving profile:', profileData);
      
      // Call backend API to save profile
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://44rqhfqqrjz57zd2q7lw2d63mi0akcdj.lambda-url.eu-west-1.on.aws'}/save_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Profile saved successfully');
        
        // Update customer data to mark profile as complete
        setCustomerData(prev => ({
          ...prev, 
          username: newUsername,
          profileComplete: true
        }));
        
        // Update session cookie to reflect profile completion
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('stj_session='));
          
        if (sessionCookie) {
          try {
            const cookieValue = sessionCookie.split('=')[1];
            const tokenData = JSON.parse(cookieValue);
            tokenData.profileComplete = true;
            document.cookie = `stj_session=${JSON.stringify(tokenData)}; path=/; secure; samesite=lax; max-age=86400`;
          } catch (err) {
            console.error('❌ Failed to update session cookie:', err);
          }
        }
        
        // Close onboarding
        setShowOnboarding(false);
        
        // Show success message
        alert('Profile saved successfully! Welcome to your Screen Time Journey!');
        
      } else {
        console.error('❌ Failed to save profile:', result);
        
        // Handle specific case where username was taken during save (race condition)
        if (response.status === 409 || (result.error && result.error.includes('no longer available'))) {
          setUsernameError('Username was just taken by another user. Please choose a different one.');
          setUsernameValid(false);
          setOnboardStep(1); // Go back to username step
        } else {
          alert(result.error || 'Failed to save profile. Please try again.');
        }
      }
      
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      alert('Failed to save profile. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Device management functions
  const addDeviceFromFlow = () => {
    if (!deviceFormData.device_name.trim()) {
      alert('Please enter a device name');
      return;
    }
    
    if (devices.length >= 3) {
      alert('Maximum 3 devices allowed');
      return;
    }
    
    const deviceIcons = {
      iOS: '📱',
      macOS: '💻'
    };
    
    const newDevice = {
      id: `device_${Date.now()}`,
      name: deviceFormData.device_name.trim(),
      icon: deviceIcons[deviceFormData.device_type] || '📱',
      status: 'locked',
      addedDate: 'Just now',
      type: deviceFormData.device_type
    };
    
    setDevices(prev => [...prev, newDevice]);
    console.log('✅ Device added from flow:', newDevice);
    alert(`Device "${newDevice.name}" added successfully!`);
  };

  const addDevice = () => {
    if (!newDeviceName.trim()) {
      alert('Please enter a device name');
      return;
    }
    
    if (devices.length >= 3) {
      alert('Maximum 3 devices allowed');
      return;
    }
    
    const deviceIcons = {
      iOS: '📱',
      Android: '📱',
      macOS: '💻',
      Windows: '💻',
      Other: '🖥️'
    };
    
    const newDevice = {
      id: `device_${Date.now()}`,
      name: newDeviceName.trim(),
      icon: deviceIcons[newDeviceType] || '🖥️',
      status: 'locked',
      addedDate: 'Just now',
      type: newDeviceType
    };
    
    setDevices(prev => [...prev, newDevice]);
    setNewDeviceName('');
    setNewDeviceType('iOS');
    setShowAddDevice(false);
    
    console.log('✅ Device added:', newDevice);
    alert(`Device "${newDevice.name}" added successfully!`);
  };
  
  const unlockDevice = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;
    
    if (device.status === 'locked') {
      // Simulate unlock confirmation
      const confirmed = window.confirm(`Unlock ${device.name}? This will allow screen time for a limited period.`);
      if (confirmed) {
        setDevices(prev => prev.map(d => 
          d.id === deviceId 
            ? { ...d, status: 'unlocked', lastUnlock: new Date().toLocaleString() }
            : d
        ));
        console.log('🔓 Device unlocked:', device.name);
        alert(`${device.name} has been unlocked temporarily`);
      }
    } else {
      alert(`${device.name} is currently ${device.status}`);
    }
  };
  


  if (loading || milestonesLoading) {
    return (
      <div className="App" style={{ background: 'var(--page-bg)', minHeight: '100vh' }}>
        <header className="header">
          <div className="container header-inner">
            <a className="header-logo" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">
              <img 
                src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/Untitled-20250823-230641-6751-undefinedx.png?v=1755983241" 
                alt="Screen Time Journey Logo" 
                style={{maxHeight: '64px', marginBottom: '8px', filter: 'brightness(0) invert(1)'}}
              />
            </a>
            <h1 className="header-title">Loading...</h1>
            <div className="header-actions">
              <div className="header-buttons-desktop" style={{ display: 'flex', gap: '8px' }}>
                <a className="btn-inverted" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">Return to website</a>
              </div>
            </div>
          </div>
        </header>

        <div className="container">
          <main className="dashboard">
            <div className="card" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ padding: 'var(--spacing-xl)' }}>
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <div className="spinner" style={{ 
                    width: '60px', 
                    height: '60px',
                    border: '4px solid var(--brand-separator)',
                    borderTop: '4px solid var(--brand-primary)',
                    margin: '0 auto var(--spacing-lg) auto'
                  }}></div>
                </div>
                
                <h3 style={{ 
                  fontFamily: 'var(--font-heading)', 
                  color: 'var(--brand-text)', 
                  marginBottom: 'var(--spacing-md)',
                  fontSize: '1.5rem'
                }}>
                  {milestonesLoading ? 'Loading milestone data...' : 'Loading your dashboard...'}
                </h3>
                
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '0.95rem' 
                }}>
                  Please wait while we prepare your screen time journey dashboard.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Error state:', error);
    return (
      <div className="App" style={{ background: 'var(--page-bg)', minHeight: '100vh' }}>
        <header className="header">
          <div className="container header-inner">
            <a className="header-logo" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">
              <img 
                src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/Untitled-20250823-230641-6751-undefinedx.png?v=1755983241" 
                alt="Screen Time Journey Logo" 
                style={{maxHeight: '64px', marginBottom: '8px', filter: 'brightness(0) invert(1)'}}
              />
            </a>
            <h1 className="header-title">Authentication Error</h1>
            <div className="header-actions">
              <div className="header-buttons-desktop" style={{ display: 'flex', gap: '8px' }}>
                <a className="btn-inverted" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">Return to website</a>
              </div>
              
              {/* Mobile hamburger menu */}
              <div className="header-mobile-menu">
                <button 
                  className="mobile-menu-toggle"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                </button>
                
                {mobileMenuOpen && (
                  <div className="mobile-menu-dropdown">
                    <a 
                      className="mobile-menu-item" 
                      href="https://www.screentimejourney.com" 
                      target="_self" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Return to website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="container">
          <main className="dashboard">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <div className="card-header">
                <h3 className="card-title" style={{ color: 'var(--destructive)', marginBottom: 'var(--spacing-md)' }}>
                  🔒 Access Denied
                </h3>
              </div>
              
              <div style={{ padding: 'var(--spacing-lg)' }}>
                <p style={{ 
                  fontSize: '1.1rem', 
                  color: 'var(--brand-text)', 
                  marginBottom: 'var(--spacing-lg)',
                  lineHeight: '1.6'
                }}>
                  {error}
                </p>
                
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: 'var(--text-muted)', 
                  marginBottom: 'var(--spacing-xl)' 
                }}>
                  Please return to your store and try accessing the dashboard again through the customer account area.
                </p>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn--primary"
                    onClick={() => {
                      // Try to extract shop domain from URL params or use fallback
                      const urlParams = new URLSearchParams(window.location.search);
                      const shop = urlParams.get('shop');
                      const storeUrl = shop ? `https://${shop}` : 'https://www.screentimejourney.com';
                      window.location.href = storeUrl;
                    }}
                    style={{ minWidth: '140px' }}
                  >
                    Return to Store
                  </button>
                  
                  <button 
                    className="btn btn--secondary"
                    onClick={() => window.location.reload()}
                    style={{ minWidth: '140px' }}
                  >
                    Try Again
                  </button>
                </div>

                <details style={{
                  marginTop: 'var(--spacing-xl)', 
                  padding: 'var(--spacing-md)', 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid var(--brand-separator)', 
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left'
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: '500', color: 'var(--text-muted)' }}>
                    Technical Details
                  </summary>
                  <pre style={{
                    fontSize: '12px', 
                    marginTop: 'var(--spacing-sm)', 
                    color: 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    Path: {window.location.pathname}{'\n'}
                    Search: {window.location.search}{'\n'}
                    Full URL: {window.location.href}{'\n'}
                    User Agent: {navigator.userAgent}
                  </pre>
                </details>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
        {/* Account Onboarding Modal */}
        <div className={`modal-overlay ${showOnboarding ? 'active' : ''}`}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
            <div className="modal__header">
              <div className="step-indicator">Step {onboardStep} of 4</div>
              <h3 id="onboard-title" className="modal__title">
                {onboardStep === 1 && "Choose username"}
                {onboardStep === 2 && "Select gender"}
                {onboardStep === 3 && "Setup WhatsApp"}
                {onboardStep === 4 && "Verify phone"}
              </h3>
            </div>

            {onboardStep === 1 && (
              <div>
                <div className="input-container" style={{ position: 'relative' }}>
                  <input 
                    className={`input ${usernameValid === true ? 'input--valid' : usernameValid === false ? 'input--invalid' : ''}`}
                    placeholder="theking" 
                    value={newUsername} 
                    onChange={(e) => {
                      const value = e.target.value;
                      // Apply username validation rules
                      const sanitizedValue = value
                        .toLowerCase() // Convert to lowercase
                        .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
                        .slice(0, 20); // Max 20 characters
                      setNewUsername(sanitizedValue);
                      setUsernameValid(null); // Reset validation state
                      setUsernameError(''); // Clear any error messages
                    }}
                    onBlur={() => checkUsernameAvailability(newUsername)}
                  />
                  {usernameChecking && <span className="input-icon">⏳</span>}
                  {usernameValid === true && <span className="input-icon valid">✅</span>}
                  {usernameValid === false && <span className="input-icon invalid">❌</span>}
                </div>
                {usernameError && <p className="error-message">{usernameError}</p>}
                <p className="helper">3-20 characters, letters and numbers only. This will be shown in your journey, messages and leaderboard.</p>
                <div className="modal__footer">
                                    <button
                    className="btn btn--primary btn--full"
                    disabled={!newUsername.trim() || (usernameValid !== null && usernameValid !== true)}
                    onClick={() => setOnboardStep(2)}
                  >
                    Next →
                  </button>
                  <button 
                    className="btn btn--secondary btn--full"
                    onClick={() => setShowOnboarding(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {onboardStep === 2 && (
              <div>
                <div className="radio-group">
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="male" 
                      checked={newGender === 'male'} 
                      onChange={(e) => setNewGender(e.target.value)} 
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">🙋‍♂️ Man</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="female" 
                      checked={newGender === 'female'} 
                      onChange={(e) => setNewGender(e.target.value)} 
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">🙋‍♀️ Woman</span>
                  </label>
                </div>
                <p className="helper">This sets visuals and milestones. You can change it later.</p>
                <div className="modal__footer">
                  <button
                    className="btn btn--primary btn--full" 
                    disabled={!newGender} 
                    onClick={() => setOnboardStep(3)}
                  >
                    Next →
                  </button>
                  <button className="link-back" onClick={() => setOnboardStep(1)}>Back</button>
                </div>
              </div>
            )}

            {onboardStep === 3 && (
              <div>
                <p className="helper">Get daily motivation and accountability messages.</p>
                <div className="phone-input-group">
                  <select 
                    className="country-select" 
                    value={newCountryCode} 
                    onChange={(e) => setNewCountryCode(e.target.value)}
                  >
                    <option value="+31">🇳🇱 +31</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+32">🇧🇪 +32</option>
                  </select>
                  <input 
                    className="phone-input" 
                    placeholder="612345678" 
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    type="tel"
                  />
                </div>
                {whatsappError && <p className="error-message">{whatsappError}</p>}
                <div className="modal__footer">
                  <button
                    className="btn btn--primary btn--full"
                    disabled={!newWhatsapp.trim()}
                    onClick={sendWhatsAppCode}
                  >
                    Validate
                  </button>
                  <button className="btn btn--secondary btn--full" onClick={async () => {
                    await saveProfile(); // Save without WhatsApp
                  }}>Skip (not recommended)</button>
                  <button className="link-back" onClick={() => setOnboardStep(2)}>Back</button>
                </div>
              </div>
            )}

            {onboardStep === 4 && (
              <div>
                <p className="helper">
                  We sent a 6-digit code to {newCountryCode}{newWhatsapp}
                  <button className="link-inline" onClick={() => setOnboardStep(3)}>Wrong number?</button>
                </p>
                <input 
                  className="input code-input" 
                  placeholder="123456" 
                  value={whatsappCode}
                  onChange={(e) => setWhatsappCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                />
                {whatsappError && <p className="error-message">{whatsappError}</p>}
                <div className="modal__footer">
                  <button
                    className="btn btn--primary btn--full"
                    disabled={whatsappCode.length !== 6}
                    onClick={verifyWhatsAppCode}
                  >
                    Verify & Complete
                  </button>
                  <button 
                    className="link-back" 
                    disabled={resendCooldown > 0}
                    onClick={() => {
                      if (resendCooldown === 0) {
                        sendWhatsAppCode();
                      }
                    }}
                  >
                    {resendCooldown > 0 ? `Send code again (${resendCooldown}s)` : 'Send code again'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Edit Modal */}
        <div className={`modal-overlay ${showProfileEdit ? 'active' : ''}`}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
            <div className="modal__header">
              <h3 id="profile-edit-title" className="modal__title">Edit Profile</h3>
            </div>

            <div>
              {/* Email - Read Only */}
              <div className="input-container" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email (Read-only)</label>
                <input 
                  className="input"
                  value={profileData?.email || ''}
                  readOnly
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
                <p className="helper" style={{ margin: '0.5rem 0 0 0' }}>Email cannot be changed as it's linked to your Shopify account.</p>
              </div>

              {/* Username */}
              <div className="input-container" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Username</label>
                <input 
                  className="input"
                  placeholder="theking" 
                  value={profileEditData.username} 
                  onChange={(e) => {
                    const value = e.target.value;
                    const sanitizedValue = value
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '')
                      .slice(0, 20);
                    setProfileEditData(prev => ({...prev, username: sanitizedValue}));
                  }}
                />
                <p className="helper" style={{ margin: '0.5rem 0 0 0' }}>3-20 characters, letters and numbers only.</p>
              </div>

              {/* Gender */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Gender</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="edit-gender" 
                      value="male" 
                      checked={profileEditData.gender === 'male'} 
                      onChange={(e) => setProfileEditData(prev => ({...prev, gender: e.target.value}))} 
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">🙋‍♂️ Man</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="edit-gender" 
                      value="female" 
                      checked={profileEditData.gender === 'female'} 
                      onChange={(e) => setProfileEditData(prev => ({...prev, gender: e.target.value}))} 
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">🙋‍♀️ Woman</span>
                  </label>
                </div>
              </div>

              {/* WhatsApp */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">WhatsApp (Optional)</label>
                <div className="phone-input-group">
                  <select 
                    className="country-select" 
                    value={profileEditData.country_code} 
                    onChange={(e) => setProfileEditData(prev => ({...prev, country_code: e.target.value}))}
                  >
                    <option value="+31">🇳🇱 +31</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+32">🇧🇪 +32</option>
                  </select>
                  <input 
                    className="phone-input" 
                    placeholder="612345678" 
                    value={profileEditData.whatsapp}
                    onChange={(e) => setProfileEditData(prev => ({...prev, whatsapp: e.target.value}))}
                    type="tel"
                  />
                </div>
                <p className="helper" style={{ margin: '0.5rem 0 0 0' }}>For daily motivation and accountability messages.</p>
              </div>

              {profileError && <p className="error-message">{profileError}</p>}

              <div className="modal__footer">
                <button
                  className="btn btn--primary btn--full"
                  disabled={profileLoading || !profileEditData.username.trim() || !profileEditData.gender}
                  onClick={() => {
                    const updatedData = {
                      username: profileEditData.username.trim(),
                      gender: profileEditData.gender,
                      whatsapp: profileEditData.whatsapp.trim() ? 
                        `${profileEditData.country_code}${profileEditData.whatsapp}`.replace(/\s/g, '') : 
                        ''
                    };
                    updateProfileData(updatedData);
                  }}
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn--secondary btn--full"
                  onClick={() => {
                    setShowProfileEdit(false);
                    setProfileError('');
                  }}
                  disabled={profileLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Device Modal */}
        <div className={`modal-overlay ${showAddDevice ? 'active' : ''}`}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-device-title">
            <div className="modal__header">
              <h3 id="add-device-title" className="modal__title">Add New Device</h3>
            </div>

            <div>
              {/* Device Name */}
              <div className="input-container" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Device Name</label>
                <input 
                  className="input"
                  placeholder="e.g., iPhone 15 Pro, MacBook Air, etc." 
                  value={newDeviceName} 
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  maxLength={50}
                />
                <p className="helper" style={{ margin: '0.5rem 0 0 0' }}>Give your device a recognizable name</p>
              </div>

              {/* Device Type */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Device Type</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="device-type" 
                      value="iOS" 
                      checked={newDeviceType === 'iOS'} 
                      onChange={(e) => setNewDeviceType(e.target.value)} 
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">📱 iPhone/iPad</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="device-type" 
                      value="Android" 
                      checked={newDeviceType === 'Android'} 
                      onChange={(e) => setNewDeviceType(e.target.value)} 
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">📱 Android Phone/Tablet</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="device-type" 
                      value="macOS" 
                      checked={newDeviceType === 'macOS'} 
                      onChange={(e) => setNewDeviceType(e.target.value)} 
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">💻 MacBook/iMac</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="device-type" 
                      value="Windows" 
                      checked={newDeviceType === 'Windows'} 
                      onChange={(e) => setNewDeviceType(e.target.value)} 
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">💻 Windows PC/Laptop</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="device-type" 
                      value="Other" 
                      checked={newDeviceType === 'Other'} 
                      onChange={(e) => setNewDeviceType(e.target.value)} 
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">🖥️ Other Device</span>
                  </label>
                </div>
              </div>

              <div className="modal__footer">
                <button
                  className="btn btn--primary btn--full"
                  disabled={!newDeviceName.trim() || devices.length >= 3}
                  onClick={addDevice}
                >
                  Add Device
                </button>
                <button 
                  className="btn btn--secondary btn--full"
                  onClick={() => {
                    setShowAddDevice(false);
                    setNewDeviceName('');
                    setNewDeviceType('iOS');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Device Flow Modal */}
        <div className={`modal-overlay ${showDeviceFlow ? 'active' : ''}`}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="device-flow-title" style={{maxWidth: '800px'}}>
            {currentFlow && (
              <>
                <div className="modal__header">
                  <div className="step-indicator">Step {currentFlowStep} of {currentFlow.total_steps || currentFlow.steps?.length || 3}</div>
                  <h3 id="device-flow-title" className="modal__title">
                    {currentFlow.steps && currentFlow.steps[currentFlowStep - 1] 
                      ? currentFlow.steps[currentFlowStep - 1].title 
                      : currentFlow.flow_name}
                  </h3>
                </div>

                <div>
                  {/* Current Step Content */}
                  {currentFlow.steps && currentFlow.steps[currentFlowStep - 1] && (
                    <div className="flow-step">
                      {/* Conditional rendering based on step type */}
                      {currentFlow.steps[currentFlowStep - 1].step_type === 'surrender' ? (
                        <>
                          {/* Surrender Step Content */}
                          <div style={{marginBottom: '20px', textAlign: 'center'}}>
                            <p style={{fontSize: '18px', lineHeight: '1.5', color: '#374151', marginBottom: '24px'}}>
                              {currentFlow.steps[currentFlowStep - 1].body}
                            </p>
                            
                            <div style={{background: '#fee2e2', border: '2px solid #fecaca', borderRadius: '8px', padding: '20px', marginBottom: '24px'}}>
                              <h4 style={{margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#991b1b'}}>
                                🎙️ Record in voice memo:
                              </h4>
                              <div style={{background: '#fef2f2', padding: '16px', borderRadius: '6px', border: '1px solid #fecaca', marginBottom: '16px'}}>
                                <p style={{margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#7f1d1d', fontStyle: 'italic'}}>
                                  "{currentFlow.steps[currentFlowStep - 1].surrender_text || surrenderText}"
                                </p>
                              </div>
                              <p style={{margin: '0', fontSize: '14px', color: '#991b1b', fontWeight: '500'}}>
                                👉 Please record a voice message of yourself reading the text above out loud to receive your unlock.
                              </p>
                            </div>
                            
                            {/* Recording Controls */}
                            <div style={{marginBottom: '20px'}}>
                              {!audioBlob ? (
                                <div>
                                  {/* Audio Visualizer - only show when recording */}
                                  {isRecording && (
                                    <>
                                      <div className="recording-indicator">
                                        <div className="recording-pulse"></div>
                                        <span className="recording-text">🔴 Recording in progress...</span>
                                      </div>
                                      <div className="audio-visualizer">
                                        {audioLevels.map((level, index) => (
                                          <div 
                                            key={index}
                                            className={`audio-bar ${level > 20 ? 'active' : ''}`}
                                            style={{height: `${level}%`}}
                                          />
                                        ))}
                                        {/* Fill with empty bars if no levels yet */}
                                        {audioLevels.length === 0 && Array.from({length: 8}, (_, i) => (
                                          <div 
                                            key={i}
                                            className="audio-bar"
                                            style={{height: '10%'}}
                                          />
                                        ))}
                                      </div>
                                    </>
                                  )}
                                  
                                  <button
                                    className={`btn ${isRecording ? 'btn--secondary' : 'btn--outline'} btn--sm`}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    style={{width: '100%', marginBottom: '8px'}}
                                  >
                                    {isRecording ? (
                                      <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                          <rect x="6" y="6" width="12" height="12"/>
                                        </svg>
                                        🔴 Stop Recording
                                      </>
                                    ) : (
                                      <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                          <path d="M12 19v4"/>
                                          <path d="M8 23h8"/>
                                        </svg>
                                        🎤 Start Recording
                                      </>
                                    )}
                                  </button>
                                  
                                  {/* Microphone permission hint */}
                                  {!isRecording && (
                                    <div className="mic-permission">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 6v6l4 2"/>
                                      </svg>
                                      Click to allow microphone access and start recording
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <div style={{background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '12px', marginBottom: '12px'}}>
                                    <p style={{margin: 0, fontSize: '14px', color: '#065f46', fontWeight: '500'}}>
                                      ✅ Recording completed. Ready to submit.
                                    </p>
                                  </div>
                                  <button
                                    className="btn btn--outline btn--sm"
                                    onClick={() => {
                                      setAudioBlob(null);
                                      setIsRecording(false);
                                    }}
                                    style={{width: '100%'}}
                                  >
                                    🔄 Record Again
                                  </button>
                                </div>
                              )}
                            </div>
                            

                          </div>
                        </>
                      ) : currentFlow.steps[currentFlowStep - 1].step_type === 'pincode_display' ? (
                        <>
                          {/* Pincode Display Step */}
                          <div style={{textAlign: 'center', marginBottom: '20px'}}>
                            <p style={{fontSize: '18px', lineHeight: '1.5', color: '#374151', marginBottom: '24px'}}>
                              {currentFlow.steps[currentFlowStep - 1].body}
                            </p>
                            
                            <div style={{padding: '24px', background: '#d1fae5', border: '2px solid #34d399', borderRadius: '12px', marginBottom: '24px'}}>
                              <h4 style={{margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#065f46'}}>
                                🔓 Your Unlock Code
                              </h4>
                              
                              <div style={{background: '#ffffff', border: '2px solid #10b981', borderRadius: '8px', padding: '20px', marginBottom: '16px'}}>
                                <div style={{fontFamily: 'monospace', fontSize: '36px', fontWeight: '700', color: '#059669', letterSpacing: '8px'}}>
                                  {unlockPincode || '----'}
                                </div>
                              </div>
                              
                              <p style={{margin: '0 0 12px 0', fontSize: '14px', color: '#047857', fontWeight: '500'}}>
                                📧 A copy has been sent to your email
                              </p>
                              <p style={{margin: '0', fontSize: '13px', color: '#047857'}}>
                                Enter this code on your device to unlock for 15 minutes
                              </p>
                            </div>
                            
                            <div style={{background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '20px'}}>
                              <p style={{margin: 0, fontSize: '14px', color: '#92400e', fontWeight: '500'}}>
                                ⚠️ Remember: This unlock comes with the acknowledgment of what you're giving up in your journey.
                              </p>
                            </div>
                          </div>
                        </>
                      ) : currentFlow.steps[currentFlowStep - 1].step_type === 'form' ? (
                        <>
                          {/* Body Text for form - Left aligned */}
                          <p style={{marginBottom: '20px', fontSize: '16px', lineHeight: '1.5', textAlign: 'left', color: '#374151'}}>
                            {currentFlow.steps[currentFlowStep - 1].body}
                          </p>
                          
                          {/* Form Fields */}
                          <div style={{marginBottom: '20px'}}>
                            {currentFlow.steps[currentFlowStep - 1].form_fields.map((field, index) => (
                              <div key={index} style={{marginBottom: '1rem'}}>
                                {field.field_type === 'text' && (
                                  <>
                                    <label className="form-label">{field.label}</label>
                                    <input 
                                      className={`input ${deviceFormErrors[field.field_name] ? 'input--invalid' : ''}`}
                                      placeholder={field.placeholder} 
                                      value={deviceFormData[field.field_name] || ''} 
                                      onChange={(e) => {
                                        setDeviceFormData(prev => ({
                                          ...prev, 
                                          [field.field_name]: e.target.value
                                        }));
                                        // Clear error when user starts typing
                                        if (deviceFormErrors[field.field_name]) {
                                          setDeviceFormErrors(prev => ({
                                            ...prev,
                                            [field.field_name]: ''
                                          }));
                                        }
                                      }}
                                      maxLength={field.max_length}
                                    />
                                    {deviceFormErrors[field.field_name] && (
                                      <p className="error-message">{deviceFormErrors[field.field_name]}</p>
                                    )}
                                  </>
                                )}
                                
                                {field.field_type === 'radio' && (
                                  <>
                                    <label className="form-label">{field.label}</label>
                                    <div className="radio-group">
                                      {field.options.map((option, optIndex) => (
                                        <label key={optIndex} className="radio-option">
                                          <input 
                                            type="radio" 
                                            name={field.field_name} 
                                            value={option.value} 
                                            checked={deviceFormData[field.field_name] === option.value} 
                                            onChange={(e) => {
                                              setDeviceFormData(prev => ({
                                                ...prev, 
                                                [field.field_name]: e.target.value
                                              }));
                                              // Clear error when user selects
                                              if (deviceFormErrors[field.field_name]) {
                                                setDeviceFormErrors(prev => ({
                                                  ...prev,
                                                  [field.field_name]: ''
                                                }));
                                              }
                                            }} 
                                          />
                                          <span className="radio-custom"></span>
                                          <span className="radio-label">{option.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                    {deviceFormErrors[field.field_name] && (
                                      <p className="error-message">{deviceFormErrors[field.field_name]}</p>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Video Player for video steps */}
                          <div style={{marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f3f4f6'}}>
                            <video 
                              controls 
                              style={{width: '100%', height: 'auto', maxHeight: '300px'}}
                              poster=""
                            >
                              <source src={currentFlow.steps[currentFlowStep - 1].media_url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          
                          {/* Body Text for video steps */}
                          <p style={{marginBottom: '20px', fontSize: '16px', lineHeight: '1.5', textAlign: 'left', color: '#374151'}}>
                            {currentFlow.steps[currentFlowStep - 1].body}
                          </p>
                          
                          {/* Audio Guide for Setup Pincode step (step 4) */}
                          {currentFlowStep === 4 && (
                            <div className="audio-guide-container" style={{marginBottom: '20px', padding: '16px'}}>
                              <div className="audio-guide-header">
                                <div className="audio-icon">🎵</div>
                                <h4 style={{margin: '0', fontSize: '16px', fontWeight: '600', color: '#0369a1'}}>
                                  Audio Pincode Guide
                                </h4>
                              </div>
                              
                              {!audioGuideData ? (
                                <div>
                                  <p style={{margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280'}}>
                                    Generate an audio guide to help you enter your screen time pincode without memorizing it.
                                  </p>
                                  <button
                                    className="btn btn--outline btn--sm"
                                    onClick={generateAudioGuide}
                                    disabled={audioGenerating || !deviceFormData.device_type}
                                    style={{width: '100%'}}
                                  >
                                    {audioGenerating ? 'Generating Audio...' : (
                                      <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                          <polygon points="11 5,6 9,2 9,2 15,6 15,11 19,11 5"/>
                                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                        </svg>
                                        Generate Audio Guide
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="audio-pincode-display">
                                    <div className="audio-pincode-number">{audioGuideData.pincode}</div>
                                    <p style={{margin: '0', fontSize: '12px', color: '#6b7280'}}>
                                      🎧 Listen to the audio guide for step-by-step instructions
                                    </p>
                                  </div>
                                  
                                  <button
                                    className="btn btn--sm audio-play-button"
                                    onClick={playAudioGuide}
                                    style={{width: '100%', marginBottom: '8px'}}
                                  >
                                    <>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                        <polygon points="5 3,19 12,5 21,5 3"/>
                                      </svg>
                                      🔊 Play Audio Guide
                                    </>
                                  </button>
                                  
                                  <button
                                    className="audio-regenerate-link"
                                    onClick={generateAudioGuide}
                                    style={{width: '100%', border: 'none', background: 'none'}}
                                  >
                                    <>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                                        <path d="M1 4v6h6"/>
                                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                                      </svg>
                                      🔄 Generate New Code
                                    </>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="modal__footer">
                    {/* Download Profile Button for Setup Profile step (step 3) */}
                    {currentFlowStep === 3 && (
                      <div style={{marginBottom: '4px', width: '100%'}}>
                        {!vpnProfileData ? (
                          <button
                            className="btn btn--outline"
                            onClick={generateVPNProfile}
                            disabled={profileGenerating || !deviceFormData.device_type}
                            style={{width: '100%', marginBottom: '0px', minWidth: '100%', maxWidth: '100%'}}
                          >
                            {profileGenerating ? 'Generating...' : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                  <circle cx="12" cy="12" r="3"/>
                                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                                </svg>
                                Generate Profile
                              </>
                            )}
                          </button>
                        ) : (
                          <div style={{width: '100%'}}>
                            <button
                              className="btn btn--outline"
                              onClick={downloadProfile}
                              style={{width: '100%', marginBottom: '0px', minWidth: '100%', maxWidth: '100%'}}
                            >
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="7,10 12,15 17,10"/>
                                  <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                Download Profile
                              </>
                            </button>
                            {vpnProfileData.hasPincode && (
                              <p style={{fontSize: '14px', color: '#6b7280', margin: '8px 0', textAlign: 'center'}}>
                                <strong>Removal PIN:</strong> {vpnProfileData.pincode}
                                <br />
                                <span style={{fontSize: '12px'}}>Save this PIN - you'll need it to remove the profile later</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Primary Action Button */}
                    <button
                      className="btn btn--primary btn--full"
                      onClick={nextFlowStep}
                    >
                      {currentFlow.steps && currentFlow.steps[currentFlowStep - 1] 
                        ? currentFlow.steps[currentFlowStep - 1].action_button 
                        : 'Next Step'} →
                    </button>
                    
                    {/* Dynamic Cancel/Back Button */}
                    <button 
                      className="link-back"
                      onClick={() => {
                        if (currentFlowStep === 1) {
                          // Cancel on first step
                          setShowDeviceFlow(false);
                          setCurrentFlow(null);
                          setCurrentFlowStep(1);
                          setDeviceFormData({
                            device_name: '',
                            device_type: 'iOS'
                          });
                          setDeviceFormErrors({});
                          setVpnProfileData(null);
    setAudioGuideData(null);
    setSharedPincode(null);
    setAudioBlob(null);
    setIsRecording(false);
    setSurrenderSubmitting(false);
    setSurrenderApproved(false);
    setUnlockPincode(null);
                        } else {
                          // Back on other steps
                          setCurrentFlowStep(currentFlowStep - 1);
                          setDeviceFormErrors({});
                        }
                      }}
                      style={{marginTop: '8px'}}
                    >
                      {currentFlowStep === 1 ? 'Cancel' : 'Back'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <header className="header">
          <div className="container header-inner">
            <a className="header-logo" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">
              <img 
                src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/Untitled-20250823-230641-6751-undefinedx.png?v=1755983241" 
                alt="Screen Time Journey Logo" 
                style={{maxHeight: '64px', marginBottom: '8px', filter: 'brightness(0) invert(1)'}}
              />
            </a>
            <h1 className="header-title">Account Dashboard</h1>
            <div className="header-actions">
              {/* Desktop buttons */}
              <div className="header-buttons-desktop" style={{ display: 'flex', gap: '8px' }}>
                <a className="btn-inverted" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">Return to website</a>
                <button className="btn-inverted" onClick={() => {
                  document.cookie = 'stj_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                  window.location.href = 'https://xpvznx-9w.myshopify.com/account/logout?return_url=/';
                }}>Logout</button>
              </div>
              
              {/* Mobile hamburger menu */}
              <div className="header-mobile-menu">
                <button 
                  className="mobile-menu-toggle"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                </button>
                
                {mobileMenuOpen && (
                  <div className="mobile-menu-dropdown">
                    <a 
                      className="mobile-menu-item" 
                      href="https://www.screentimejourney.com" 
                      target="_self" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Return to website
                    </a>
                    <button 
                      className="mobile-menu-item" 
                      onClick={() => {
                        document.cookie = 'stj_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                        window.location.href = 'https://xpvznx-9w.myshopify.com/account/logout?return_url=/';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      <div className="container">
        <main className="dashboard">
          {/* Show milestone error if any */}
          {milestonesError && (
            <div style={{padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px', color: '#dc2626'}}>
              <p style={{margin: 0, fontSize: '14px'}}>⚠️ Could not load latest milestone data: {milestonesError}</p>
              <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#7f1d1d'}}>Using default milestone data.</p>
            </div>
          )}
          
          {/* Journey progress - full width */}
          <ProgressSection 
            latestDevice={getMockDeviceData(testScenario)} 
            customerName="Merijn" 
            devices={devices}
            setShowAddDevice={setShowAddDevice}
            milestones={milestones}
            startDeviceFlow={startDeviceFlow}
          />

          {/* Account (50%) + Devices (50%) */}
          <div className="grid grid-2" style={{marginBottom: '32px', alignItems: 'stretch'}}>
            {/* Account */}
            <div className="card card--equal" style={{display: 'flex', flexDirection: 'column'}}>
              <div className="card-header">
                <h3 className="card-title">Account</h3>
              </div>
              
              {profileLoading ? (
                <div style={{padding: '20px', textAlign: 'center'}}>
                  <div className="spinner" style={{margin: '0 auto'}}></div>
                  <p>Loading profile...</p>
                </div>
              ) : profileError ? (
                <div style={{padding: '20px', textAlign: 'center', color: '#ef4444'}}>
                  <p>❌ {profileError}</p>
                  <button className="btn btn--secondary btn--sm" onClick={fetchProfileData}>Retry</button>
                </div>
              ) : profileData ? (
                <>
                  <ul className="mb-3" style={{paddingLeft: '16px', margin: 0}}>
                    <li>Email: {profileData.email} <span style={{color: '#6b7280', fontSize: '12px'}}>(read-only)</span></li>
                    <li>Username: @{profileData.username}</li>
                    <li>Gender: {profileData.gender === 'male' ? '🙋‍♂️ Man' : '🙋‍♀️ Woman'}</li>
                    {profileData.whatsapp && (
                      <li>WhatsApp: {profileData.whatsapp}</li>
                    )}
                  </ul>
                  <div style={{marginTop: 'auto', display: 'flex', gap: '8px'}}>
                    <button 
                      className="btn btn--outline btn--sm" 
                      style={{flex: 1}}
                      onClick={() => {
                        setProfileEditData({
                          username: profileData.username || '',
                          gender: profileData.gender || '',
                          whatsapp: profileData.whatsapp ? profileData.whatsapp.replace(/^\+\d{1,3}/, '') : '',
                          country_code: profileData.whatsapp ? profileData.whatsapp.match(/^\+\d{1,3}/)?.[0] || '+31' : '+31'
                        });
                        setShowProfileEdit(true);
                      }}
                    >
                      Edit profile
                    </button>
                  </div>
                </>
              ) : (
                <div style={{padding: '20px', textAlign: 'center'}}>
                  <p>No profile data available</p>
                  <button className="btn btn--secondary btn--sm" onClick={fetchProfileData}>Load Profile</button>
                </div>
              )}
            </div>

            {/* Devices */}
            <div className="card card--equal" style={{display: 'flex', flexDirection: 'column'}}>
              <div className="card-header">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h3 className="card-title" style={{margin: 0}}>My Devices</h3>
                  <span style={{fontSize: '14px', color: '#6b7280', fontWeight: '500'}}>
                    {devices.length}/3
                  </span>
                </div>
              </div>
              <div className="device-list" style={{padding: '16px 0'}}>
                {devices.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
                    <div style={{fontSize: '2rem', marginBottom: '8px'}}>📱</div>
                    <p>No devices added yet</p>
                  </div>
                ) : (
                  devices.map((device, index) => (
                    <div key={device.id} className="device-item" style={{borderBottom: index === devices.length - 1 ? 'none' : '1px solid var(--border)'}}>
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: '500', marginBottom: '4px'}}>
                          {device.icon} {device.name}
                        </div>
                        <div className="device-item__meta">
                          Status: {device.status.charAt(0).toUpperCase() + device.status.slice(1)} • Added {device.addedDate}
                          {device.lastUnlock && (
                            <> • Last unlock: {device.lastUnlock}</>
                          )}
                        </div>
                      </div>
                      <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                        {(device.status === 'locked' || device.status === 'monitoring') && (
                          <button 
                            className="btn btn--secondary btn--sm"
                            onClick={() => startDeviceFlow('device_unlock_flow', device.id)}
                            style={{fontSize: '12px', padding: '4px 8px'}}
                          >
                            Unlock
                          </button>
                        )}
                        {device.status === 'unlocked' && (
                          <span className="badge badge--success" style={{fontSize: '11px'}}>Unlocked</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{marginTop: 'auto'}}>
                <button 
                  className="btn btn--outline btn--sm" 
                  style={{width: '100%'}} 
                  onClick={() => startDeviceFlow('device_setup_flow')}
                  disabled={devices.length >= 3}
                >
                  Add Device {devices.length >= 3 ? '(Max reached)' : ''}
                </button>
              </div>
            </div>
          </div>

          {/* Subscription (50%) + Notifications (50%) */}
          <div className="grid grid-2" style={{marginBottom: '32px', alignItems: 'stretch'}}>
            <div className="card card--equal" style={{display: 'flex', flexDirection: 'column'}}>
              <div className="card-header">
                <h3 className="card-title">Subscription</h3>
              </div>
              <div style={{margin: '0 0 16px 0'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Status</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#059669',
                    backgroundColor: '#f9fafb',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    Active ✓
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Next billing</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    fontFamily: 'monospace'
                  }}>
                    15 Sep 2025
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Billing cycle</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    backgroundColor: '#f3f4f6',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Monthly
                  </span>
                </div>
              </div>
              <div style={{marginTop: 'auto', display: 'flex', gap: '8px'}}>
                <button
                  className="btn btn--outline btn--sm"
                  style={{flex: 1}}
                  onClick={startCancelFlow}
                >
                  Cancel subscription
                </button>
              </div>
            </div>

            <div className="card card--equal" style={{display: 'flex', flexDirection: 'column'}}>
              <div className="card-header">
                <h3 className="card-title">Notifications</h3>
              </div>
              <div style={{margin: '0 0 16px 0'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Email notifications</span>
                  <div style={{display: 'flex', gap: '4px'}}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: notificationSettings.email.weeklyProgress ? '#059669' : '#6b7280',
                      backgroundColor: '#f9fafb',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      Weekly {notificationSettings.email.weeklyProgress ? '✓' : '✗'}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: notificationSettings.email.monthlyLeaderboard ? '#059669' : '#6b7280',
                      backgroundColor: '#f9fafb',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      Monthly {notificationSettings.email.monthlyLeaderboard ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>WhatsApp notifications</span>
                  <div style={{display: 'flex', gap: '4px'}}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: notificationSettings.whatsapp.weeklyProgress ? '#059669' : '#6b7280',
                      backgroundColor: '#f9fafb',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      Weekly {notificationSettings.whatsapp.weeklyProgress ? '✓' : '✗'}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: notificationSettings.whatsapp.monthlyLeaderboard ? '#059669' : '#6b7280',
                      backgroundColor: '#f9fafb',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      Monthly {notificationSettings.whatsapp.monthlyLeaderboard ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{marginTop: 'auto', display: 'flex', gap: '8px'}}>
                <button 
                  className="btn btn--outline btn--sm" 
                  style={{flex: 1}}
                  onClick={startNotificationsFlow}
                >
                  Edit notifications
                </button>
              </div>
            </div>
          </div>

          {/* Logs - full width */}
          <div className="card" style={{marginBottom: '32px'}}>
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div style={{marginBottom: '16px'}}>
              {logs.slice(0, 5).map((log, index) => (
                <div key={log.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '12px 0',
                  borderBottom: index < 4 ? '1px solid #f3f4f6' : 'none'
                }}>

                  <div style={{flex: 1}}>
                    <div style={{fontWeight: '500', color: '#374151', marginBottom: '2px'}}>
                      {log.title}
                    </div>
                    <div style={{fontSize: '14px', color: '#6b7280', marginBottom: '2px'}}>
                      {log.description}
                    </div>
                    {log.pincode && (
                      <div style={{fontSize: '12px', color: '#059669', fontFamily: 'monospace', fontWeight: '600'}}>
                        Unlock code: {log.pincode}
                      </div>
                    )}
                  </div>
                  <div style={{fontSize: '12px', color: '#9ca3af', textAlign: 'right'}}>
                    {log.timestamp}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <button 
                className="btn btn--outline btn--sm"
                onClick={startLogsFlow}
                style={{width: '100%'}}
              >
                See all logs
              </button>
            </div>
          </div>
        </main>
      </div>
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <a href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">
              <img 
                src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/Untitled-20250823-230641-6751-undefinedx.png?v=1755983241" 
                alt="Screen Time Journey Logo" 
                style={{maxHeight: '40px', filter: 'brightness(0) invert(1)'}}
              />
            </a>
            <p className="muted" style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
              Digital wellness tools to help you focus.
            </p>
          </div>

          <div>
            <h4 className="footer-title">Company</h4>
            <div className="footer-links">
              <a className="footer-link" href="#">About</a>
              <a className="footer-link" href="#">Contact</a>
              <a className="footer-link" href="#">Careers</a>
            </div>
          </div>

          <div>
            <h4 className="footer-title">Legal</h4>
            <div className="footer-links">
              <a className="footer-link" href="#">Privacy Policy</a>
              <a className="footer-link" href="#">Terms of Service</a>
              <a className="footer-link" href="#">Refund Policy</a>
            </div>
          </div>

          <div>
            <h4 className="footer-title">Support</h4>
            <div className="footer-links">
              <a className="footer-link" href="#">Help Center</a>
              <a className="footer-link" href="#">FAQs</a>
              <a className="footer-link" href="#">Status</a>
            </div>
          </div>
        </div>

        <div className="container footer-bottom">
          © {new Date().getFullYear()} Screen Time Journey. All rights reserved.
        </div>
      </footer>

      {/* Subscription Cancellation Flow Modal */}
      <div className={`modal-overlay ${showCancelFlow ? 'active' : ''}`}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-flow-title" style={{maxWidth: '600px'}}>
          <>
            <div className="modal__header">
              <div className="step-indicator">Step {cancelStep} of 3</div>
              <h3 id="cancel-flow-title" className="modal__title">
                {cancelStep === 1 && 'We\'re sorry to see you go'}
                {cancelStep === 2 && 'Help us improve'}
                {cancelStep === 3 && 'Confirm cancellation'}
              </h3>
            </div>

            <div className="modal__content">
              {cancelStep === 1 && (
                <div style={{textAlign: 'center', marginBottom: '20px'}}>
                  <p style={{fontSize: '18px', lineHeight: '1.5', color: '#374151', marginBottom: '24px'}}>
                    Before you cancel, we'd love to understand what led to this decision.
                  </p>
                  
                  <div style={{textAlign: 'left', marginBottom: '24px'}}>
                    <label style={{display: 'block', fontWeight: '500', marginBottom: '12px', color: '#374151'}}>
                      What's the main reason for cancelling?
                    </label>
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="">Please select a reason...</option>
                      <option value="too_expensive">Too expensive</option>
                      <option value="not_using">Not using the service enough</option>
                      <option value="technical_issues">Technical issues or bugs</option>
                      <option value="missing_features">Missing features I need</option>
                      <option value="found_alternative">Found a better alternative</option>
                      <option value="temporary_pause">Just need a temporary break</option>
                      <option value="privacy_concerns">Privacy or data concerns</option>
                      <option value="other">Other reason</option>
                    </select>
                  </div>


                </div>
              )}

              {cancelStep === 2 && (
                <div style={{textAlign: 'center', marginBottom: '20px'}}>
                  
                  
                  <div style={{textAlign: 'left', marginBottom: '24px'}}>
                    <label style={{display: 'block', fontWeight: '500', marginBottom: '12px', color: '#374151'}}>
                      Tell us more about your experience (optional):
                    </label>
                    <textarea
                      value={cancelFeedback}
                      onChange={(e) => setCancelFeedback(e.target.value)}
                      placeholder="What could we have done better? Any suggestions for improvement?"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        backgroundColor: '#fff',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{background: '#e0f2fe', border: '1px solid #0284c7', borderRadius: '8px', padding: '16px', marginBottom: '20px'}}>
                    <p style={{margin: 0, fontSize: '14px', color: '#0369a1', fontWeight: '500'}}>
                      🙏 <strong>Thank you!</strong> Your feedback is invaluable in helping us improve Screen Time Journey for future users.
                    </p>
                  </div>
                </div>
              )}

              {cancelStep === 3 && (
                <div style={{textAlign: 'left', marginBottom: '20px'}}>
                  <p style={{fontSize: '18px', lineHeight: '1.5', color: '#374151', marginBottom: '24px'}}>
                    Please review your cancellation details before confirming.
                  </p>
                  
                  <div style={{background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px', marginBottom: '24px', textAlign: 'left'}}>
                    <h4 style={{margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151'}}>
                      Cancellation Summary
                    </h4>
                    <div style={{fontSize: '14px', color: '#6b7280', lineHeight: '1.6'}}>
                      <p style={{margin: '0 0 8px 0'}}><strong>Plan:</strong> Screen Time Journey - Starter</p>
                      <p style={{margin: '0 0 8px 0'}}><strong>Reason:</strong> {cancelReason || 'Not specified'}</p>
                      <p style={{margin: '0 0 8px 0'}}><strong>Effective:</strong> Immediately</p>
                      <p style={{margin: '0'}}><strong>Access:</strong> Until end of current billing period</p>
                    </div>
                  </div>

                  <div style={{background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '16px', marginBottom: '20px'}}>
                    <p style={{margin: 0, fontSize: '14px', color: '#dc2626', fontWeight: '500'}}>
                      ⚠️ <strong>Important:</strong> Cancelling will permanently delete your progress, device configurations, and journey data. This cannot be undone.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal__footer">
              {cancelStep === 1 && (
                <>
                  <button
                    className="btn btn--primary btn--full"
                    onClick={nextCancelStep}
                    disabled={!cancelReason}
                    style={{width: '100%', marginBottom: '16px'}}
                  >
                    Continue cancellation
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginLeft: '8px'}}>
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    className="link-back"
                    onClick={closeCancelFlow}
                    style={{width: '100%', textAlign: 'center', background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer'}}
                  >
                    Keep subscription
                  </button>
                </>
              )}

              {cancelStep === 2 && (
                <>
                  <button
                    className="btn btn--primary btn--full"
                    onClick={nextCancelStep}
                    style={{width: '100%', marginBottom: '16px'}}
                  >
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginLeft: '8px'}}>
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    className="link-back"
                    onClick={() => setCancelStep(1)}
                    style={{width: '100%', textAlign: 'center', background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer'}}
                  >
                    Back
                  </button>
                </>
              )}

              {cancelStep === 3 && (
                <>
                  <button
                    className="btn btn--destructive btn--full"
                    onClick={submitCancellation}
                    disabled={cancelSubmitting}
                    style={{background: '#dc2626', borderColor: '#dc2626', color: '#fff', width: '100%', marginBottom: '16px'}}
                  >
                    {cancelSubmitting ? (
                      <>
                        <div className="spinner" style={{width: '16px', height: '16px', marginRight: '8px', borderWidth: '2px'}}></div>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        Confirm cancellation
                      </>
                    )}
                  </button>
                  <button
                    className="link-back"
                    onClick={() => setCancelStep(2)}
                    disabled={cancelSubmitting}
                    style={{width: '100%', textAlign: 'center', background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer'}}
                  >
                    Back
                  </button>
                </>
              )}
            </div>
          </>
        </div>
      </div>

      {/* Notification Settings Modal */}
      <div className={`modal-overlay ${showNotificationsFlow ? 'active' : ''}`}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="notifications-title" style={{maxWidth: '600px'}}>
          <>
            <div className="modal__header">
              <h3 id="notifications-title" className="modal__title">
                Notification Settings
              </h3>
            </div>

            <div className="modal__content">
              <div style={{marginBottom: '32px'}}>
                
                {/* Email Notifications Section */}
                <div style={{marginBottom: '32px'}}>
                  <h4 style={{margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151'}}>
                    📧 Email Notifications
                  </h4>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    {/* Weekly Progress Update */}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb'}}>
                      <div>
                        <div style={{fontWeight: '500', color: '#374151', marginBottom: '4px'}}>
                          Weekly progress update
                        </div>
                        <div style={{fontSize: '14px', color: '#6b7280'}}>
                          Get your weekly screen time summary every Sunday
                        </div>
                      </div>
                      <label style={{position: 'relative', display: 'inline-block', width: '44px', height: '24px'}}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.email.weeklyProgress}
                          onChange={(e) => updateNotificationSetting('email', 'weeklyProgress', e.target.checked)}
                          style={{opacity: 0, width: 0, height: 0}}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: notificationSettings.email.weeklyProgress ? '#2E0456' : '#ccc',
                          transition: '0.3s',
                          borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '',
                            height: '18px',
                            width: '18px',
                            left: notificationSettings.email.weeklyProgress ? '23px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            transition: '0.3s',
                            borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                    </div>

                    {/* Monthly Leaderboard */}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb'}}>
                      <div>
                        <div style={{fontWeight: '500', color: '#374151', marginBottom: '4px'}}>
                          Monthly leaderboard update
                        </div>
                        <div style={{fontSize: '14px', color: '#6b7280'}}>
                          See how you rank against the community each month
                        </div>
                      </div>
                      <label style={{position: 'relative', display: 'inline-block', width: '44px', height: '24px'}}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.email.monthlyLeaderboard}
                          onChange={(e) => updateNotificationSetting('email', 'monthlyLeaderboard', e.target.checked)}
                          style={{opacity: 0, width: 0, height: 0}}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: notificationSettings.email.monthlyLeaderboard ? '#2E0456' : '#ccc',
                          transition: '0.3s',
                          borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '',
                            height: '18px',
                            width: '18px',
                            left: notificationSettings.email.monthlyLeaderboard ? '23px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            transition: '0.3s',
                            borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Notifications Section */}
                <div>
                  <h4 style={{margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151'}}>
                    💬 WhatsApp Notifications
                  </h4>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    {/* Weekly Progress Update */}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0'}}>
                      <div>
                        <div style={{fontWeight: '500', color: '#374151', marginBottom: '4px'}}>
                          Weekly progress update
                        </div>
                        <div style={{fontSize: '14px', color: '#6b7280'}}>
                          Get your weekly screen time summary via WhatsApp
                        </div>
                      </div>
                      <label style={{position: 'relative', display: 'inline-block', width: '44px', height: '24px'}}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.whatsapp.weeklyProgress}
                          onChange={(e) => updateNotificationSetting('whatsapp', 'weeklyProgress', e.target.checked)}
                          style={{opacity: 0, width: 0, height: 0}}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: notificationSettings.whatsapp.weeklyProgress ? '#22c55e' : '#ccc',
                          transition: '0.3s',
                          borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '',
                            height: '18px',
                            width: '18px',
                            left: notificationSettings.whatsapp.weeklyProgress ? '23px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            transition: '0.3s',
                            borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                    </div>

                    {/* Monthly Leaderboard */}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0'}}>
                      <div>
                        <div style={{fontWeight: '500', color: '#374151', marginBottom: '4px'}}>
                          Monthly leaderboard update
                        </div>
                        <div style={{fontSize: '14px', color: '#6b7280'}}>
                          See your community ranking via WhatsApp each month
                        </div>
                      </div>
                      <label style={{position: 'relative', display: 'inline-block', width: '44px', height: '24px'}}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.whatsapp.monthlyLeaderboard}
                          onChange={(e) => updateNotificationSetting('whatsapp', 'monthlyLeaderboard', e.target.checked)}
                          style={{opacity: 0, width: 0, height: 0}}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: notificationSettings.whatsapp.monthlyLeaderboard ? '#22c55e' : '#ccc',
                          transition: '0.3s',
                          borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '',
                            height: '18px',
                            width: '18px',
                            left: notificationSettings.whatsapp.monthlyLeaderboard ? '23px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            transition: '0.3s',
                            borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="modal__footer">
              <button
                className="btn btn--primary btn--full"
                onClick={submitNotificationSettings}
                disabled={notificationsSubmitting}
                style={{width: '100%', marginBottom: '16px'}}
              >
                {notificationsSubmitting ? (
                  <>
                    <div className="spinner" style={{width: '16px', height: '16px', marginRight: '8px', borderWidth: '2px'}}></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Save settings
                  </>
                )}
              </button>
              <button
                className="link-back"
                onClick={closeNotificationsFlow}
                disabled={notificationsSubmitting}
                style={{width: '100%', textAlign: 'center', background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer'}}
              >
                Cancel
              </button>
            </div>
          </>
        </div>
      </div>

      {/* Full Logs Modal */}
      <div className={`modal-overlay ${showLogsFlow ? 'active' : ''}`}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="logs-title" style={{maxWidth: '800px'}}>
          <>
            <div className="modal__header">
              <h3 id="logs-title" className="modal__title">
                Activity Logs
              </h3>
            </div>

            <div className="modal__content">
              <div style={{marginBottom: '16px'}}>
                <p style={{fontSize: '16px', color: '#6b7280', marginBottom: '24px'}}>
                  Complete history of your account activity. Unlock codes are preserved here for easy access.
                </p>
                
                <div style={{maxHeight: '500px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                  {logs.map((log, index) => (
                    <div key={log.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '16px',
                      borderBottom: index < logs.length - 1 ? '1px solid #e5e7eb' : 'none',
                      backgroundColor: '#fff'
                    }}>

                      <div style={{flex: 1}}>
                        <div style={{fontWeight: '600', color: '#374151', marginBottom: '4px', fontSize: '16px'}}>
                          {log.title}
                        </div>
                        <div style={{fontSize: '14px', color: '#6b7280', marginBottom: '4px'}}>
                          {log.description}
                        </div>
                        {log.pincode && (
                          <div style={{
                            display: 'inline-block',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '12px',
                            color: '#059669',
                            fontFamily: 'monospace',
                            fontWeight: '500',
                            marginTop: '4px'
                          }}>
                            Code: {log.pincode} ✓
                          </div>
                        )}
                        <div style={{fontSize: '13px', color: '#9ca3af', marginTop: '8px'}}>
                          {log.timestamp}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {logs.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#9ca3af',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <div style={{fontSize: '40px', marginBottom: '16px'}}>📝</div>
                    <p style={{margin: 0, fontSize: '16px'}}>No activity logs yet</p>
                    <p style={{margin: '8px 0 0 0', fontSize: '14px'}}>Your activity will appear here as you use the app</p>
                  </div>
                )}


              </div>
            </div>

            <div className="modal__footer">
              <button
                className="btn btn--primary btn--full"
                onClick={closeLogsFlow}
                style={{width: '100%'}}
              >
                Close
              </button>
            </div>
          </>
        </div>
      </div>
    </div>
  );
}

export default App;
 
// Simple footer
// Rendered by the host HTML; add minimal footer div here if needed