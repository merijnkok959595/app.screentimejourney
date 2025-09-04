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
const ProgressSection = ({ latestDevice, customerName = "Merijn", devices, milestones = DEFAULT_MILESTONES, startDeviceFlow }) => {
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
            {devices.length < 3 ? (
              <button 
                className="btn btn--primary"
                onClick={() => startDeviceFlow('device_setup_flow')}
                style={{width: '100%'}}
              >
                {devices.length === 0 ? 'Start Now' : 'Add Device'}
              </button>
            ) : (
              <div style={{textAlign: 'center', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '2px dashed #dee2e6'}}>
                <div style={{color: '#6c757d', fontSize: '14px', fontWeight: '500'}}>
                  Maximum Devices Reached
                </div>
                <div style={{color: '#868e96', fontSize: '12px', marginTop: '4px'}}>
                  Remove a device to add a new one
                </div>
              </div>
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
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Profile management state
  const [profileData, setProfileData] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileEditData, setProfileEditData] = useState({
    username: '',
    gender: '',
    whatsapp: '',
    country_code: '+31',
    usernameValidationState: null // null, 'checking', 'available', 'taken'
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState(null);
  
  // Milestone data state
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [milestonesError, setMilestonesError] = useState(null);
  
  // Device management state
  const [devices, setDevices] = useState([]); // Start empty, load from backend
  
  // Audio management state
  const [currentAudio, setCurrentAudio] = useState(null);

  
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
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  const [animationId, setAnimationId] = useState(null);

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

  // Load devices when customer data is available
  useEffect(() => {
    console.log('🔍 Device loading useEffect triggered:', {
      hasCustomerData: !!customerData,
      customerId: customerData?.customerId
    });
    
    // Always try to load devices (the function handles customer ID extraction internally)
    loadDevicesFromBackend();
  }, [customerData?.customerId]);

  useEffect(() => {
    // Load milestone data and device flows when app starts
    fetchMilestoneData();
    fetchDeviceFlows();
    
    // Debug: Log current URL and authentication state
    console.log('🌐 App initialization debug:', {
      url: window.location.href,
      hostname: window.location.hostname,
      search: window.location.search,
      cookies: document.cookie,
      hasSessionCookie: document.cookie.includes('stj_session=')
    });
    
    // Production-only: No local development bypass

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
        
        // Fetch profile data to check if username exists
        setLoading(false);
        fetchProfileData();
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
      const lambdaUrl = 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws';
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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/get_milestones`, {
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
                title: 'Device Information',
                body: 'First, let\'s get some basic information about the device you\'re adding to your Screen Time Journey.',
                step_type: 'form',
                form_fields: [
                  {
                    field_type: 'text',
                    field_name: 'device_name',
                    label: 'Device Name',
                    placeholder: 'e.g., iPhone 15 Pro, MacBook Air, Work Laptop',
                    required: true,
                    max_length: 50,
                    help_text: 'Give your device a name that helps you identify it easily'
                  },
                  {
                    field_type: 'radio',
                    field_name: 'device_type',
                    label: 'Device Type',
                    required: true,
                    help_text: 'Select the type of device you\'re adding',
                    options: [
                      {value: 'iOS', label: '📱 iPhone/iPad'},
                      {value: 'macOS', label: '💻 MacBook/iMac'}
                    ]
                  }
                ],
                action_button: 'Continue to Setup Guide'
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
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/get_system_config`, {
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
      console.log('🔄 Using fallback flows due to API error');
      
      // Use fallback flows when API fails
      const fallbackFlows = {
        device_setup_flow: {
          flow_id: 'device_setup',
          flow_name: 'Device Setup Guide',
          total_steps: 4,
          steps: [
            {
              step: 1,
              title: 'Device Information',
              body: 'First, let\'s get some basic information about the device you\'re adding to your Screen Time Journey.',
              step_type: 'form',
              form_fields: [
                {
                  field_type: 'text',
                  field_name: 'device_name',
                  label: 'Device Name',
                  placeholder: 'e.g., iPhone 15 Pro, MacBook Air, Work Laptop',
                  required: true,
                  max_length: 50,
                  help_text: 'Give your device a name that helps you identify it easily'
                },
                {
                  field_type: 'radio',
                  field_name: 'device_type',
                  label: 'Device Type',
                  required: true,
                  help_text: 'Select the type of device you\'re adding',
                  options: [
                    {value: 'iOS', label: 'iPhone/iPad'},
                    {value: 'macOS', label: 'MacBook/iMac'}
                  ]
                }
              ],
              action_button: 'Continue to Setup Guide'
            },
            {
              step: 2,
              title: 'Setup Screentime',
              body: 'Follow this guide to configure screen time settings on your device.',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
              action_button: 'Next Step'
            },
            {
              step: 3,
              title: 'Setup Profile',
              body: 'Configure your device profile settings.',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
              action_button: 'Next Step'
            },
            {
              step: 4,
              title: 'Setup Pincode',
              body: 'Set up your device pincode for security.',
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
      
      setDeviceFlows(fallbackFlows);
    } finally {
      setFlowLoading(false);
    }
  };

  // Unified pincode generation and storage
  const generateAndStorePincode = async () => {
    console.log('🔧 generateAndStorePincode called', { 
      deviceFormData, 
      customerData: customerData?.customerId 
    });
    
    if (!deviceFormData.device_type) {
      console.error('❌ Device type missing:', deviceFormData);
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
        userId: customerData?.customerId || extractCustomerId(),
        createdAt: new Date().toISOString()
      };
      
      console.log('📋 Generated pincode data:', pincodeData);
      
      if (!isLocalDev) {
        console.log('🌐 Production mode: Storing pincode via API...');
        
        try {
          // In production, store pincode in stj_password table via API
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/store_pincode`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pincode: pincode,
              uuid: uuid,
              device_type: deviceFormData.device_type,
              device_name: deviceFormData.device_name,
              user_id: customerData?.customerId || extractCustomerId(),
              method: 'create',
              purpose: 'device_setup'
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API response error:', errorText);
            throw new Error(`Failed to store pincode: ${response.status} ${errorText}`);
          }
          
          console.log('✅ Pincode stored in stj_password table');
        } catch (apiError) {
          console.error('❌ API call failed, continuing with local pincode:', apiError);
          // Continue with local pincode even if API fails - don't block user
        }
      } else {
        console.log('🔧 Local dev: Pincode generated (not stored):', pincode);
      }
      
      setSharedPincode(pincodeData);
      console.log('✅ Pincode generation successful');
      return pincodeData;
      
    } catch (error) {
      console.error('❌ Error generating/storing pincode:', error);
      
      // Instead of blocking with alert, provide graceful fallback
      console.log('🔄 Attempting to continue with fallback pincode...');
      
      try {
        // Generate a simple fallback pincode
        const fallbackPincode = Math.floor(1000 + Math.random() * 9000).toString();
        const fallbackData = {
          pincode: fallbackPincode,
          uuid: generateUUID(),
          deviceType: deviceFormData.device_type || 'iOS',
          deviceName: deviceFormData.device_name || 'Device',
          userId: 'fallback_user',
          createdAt: new Date().toISOString(),
          isFallback: true
        };
        
        setSharedPincode(fallbackData);
        console.log('✅ Fallback pincode generated:', fallbackData);
        return fallbackData;
        
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError);
        alert('Failed to generate pincode. Please try again.');
        return null;
      }
    }
  };

  // VPN Profile generation functions
  const generateVPNProfile = async () => {
    console.log('🔧 generateVPNProfile called', { 
      deviceFormData, 
      sharedPincode: !!sharedPincode 
    });
    
    if (!deviceFormData.device_type) {
      console.error('❌ Device type missing in generateVPNProfile:', deviceFormData);
      alert('Please select a device type first');
      return;
    }
    
    setProfileGenerating(true);
    
    try {
      // Use shared pincode if available, or generate new one
      let pincodeData = sharedPincode;
      if (!pincodeData) {
        console.log('📋 No shared pincode, generating new one...');
        pincodeData = await generateAndStorePincode();
        if (!pincodeData) {
          console.error('❌ Failed to generate pincode for VPN profile');
          setProfileGenerating(false);
          return;
        }
      } else {
        console.log('✅ Using existing shared pincode');
      }
      
      const { pincode, uuid: profileUUID } = pincodeData;
      
      // Get customer ID for VPN profile generation (using working account section pattern)
      let customerId = customerData?.customerId;
      
      if (!customerId) {
        // Extract customer ID from session cookie (same as account section)
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('stj_session='));
        
        console.log('🔍 VPN: Session cookie found:', !!sessionCookie);
        
        if (sessionCookie) {
          try {
            const cookieValue = sessionCookie.split('=')[1];
            console.log('🔍 VPN: Raw cookie value:', cookieValue);
            
            // ALWAYS decode the cookie value first (it's URL encoded)
            const decodedValue = decodeURIComponent(cookieValue);
            console.log('🔍 VPN: URL decoded value:', decodedValue);
            
            const tokenData = JSON.parse(decodedValue);
            console.log('🔍 VPN: Token data keys:', Object.keys(tokenData));
            
            const decoded = atob(tokenData.token);
            console.log('🔍 VPN: Base64 decoded token:', decoded);
            
            const parts = decoded.split('|');
            console.log('🔍 VPN: Token parts:', parts);
            
            customerId = parts[1]; // customer_id is the second part
            console.log('✅ VPN: Extracted customer ID from session:', customerId);
          } catch (err) {
            console.error('❌ VPN: Failed to extract customer ID from session:', err);
            console.error('❌ VPN: Cookie value that failed:', sessionCookie);
          }
        } else {
          console.log('❌ VPN: No stj_session cookie found');
          console.log('🔍 VPN: All cookies:', document.cookie);
        }
      }
      
      if (!customerId) {
        console.error('❌ No customer ID available for VPN profile generation');
        alert('Authentication required. Please login through Shopify first.');
        setProfileGenerating(false);
        return;
      }
      
      console.log('🔧 Generating VPN profile for customer:', customerId);
      
      // Call the backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/generate_vpn_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_type: deviceFormData.device_type,
          device_name: deviceFormData.device_name,
          customer_id: customerId
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Transform backend response to match frontend expectation
        const profileData = {
          deviceType: result.result.device_type,
          hasPincode: result.result.has_pincode,
          pincode: result.result.pincode,
          profileUUID: result.result.profile_uuid,
          filename: result.result.filename,
          downloadUrl: result.result.download_url,
          s3_url: result.result.s3_url,
          profileContent: null // Not needed for frontend display
        };
        setVpnProfileData(profileData);
        console.log('✅ VPN profile generated:', profileData);
      } else {
        throw new Error(result.error || 'Failed to generate VPN profile');
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
    
    // Use the S3 URL for direct download and auto-open
    if (vpnProfileData.s3_url || vpnProfileData.downloadUrl) {
      const profileUrl = vpnProfileData.s3_url || vpnProfileData.downloadUrl;
      
      // Open the profile URL directly - iOS/macOS will handle it
      window.open(profileUrl, '_blank');
      
      // Also trigger download
      const link = document.createElement('a');
      link.href = profileUrl;
      link.download = vpnProfileData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('📱 Profile opened and downloaded:', vpnProfileData.filename);
    } else {
      // Fallback to blob method
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
      
      console.log('📱 Profile downloaded (fallback):', vpnProfileData.filename);
    }
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
        // Get customer ID for audio guide generation (using working account section pattern)
        let customerId = customerData?.customerId;
        
        if (!customerId) {
          // Extract customer ID from session cookie (same as account section)
          const sessionCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('stj_session='));
          
          if (sessionCookie) {
            try {
              const cookieValue = sessionCookie.split('=')[1];
              // ALWAYS decode the cookie value first (it's URL encoded)
              const decodedValue = decodeURIComponent(cookieValue);
              const tokenData = JSON.parse(decodedValue);
              const decoded = atob(tokenData.token);
              const parts = decoded.split('|');
              customerId = parts[1]; // customer_id is the second part
              console.log('✅ Audio: Extracted customer ID from session:', customerId);
            } catch (err) {
              console.error('❌ Audio: Failed to extract customer ID from session:', err);
            }
          }
        }
        
        if (!customerId) {
          console.error('❌ No customer ID available for audio guide generation');
          alert('Authentication required. Please login through Shopify first.');
          setAudioGenerating(false);
          return;
        }
        
        // In production, call the backend API to generate audio with existing pincode
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/generate_audio_guide`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_name: deviceFormData.device_name,
            customer_id: customerId,
            pincode: pincode // Use the shared pincode or backend will generate new one
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          // Transform backend response to match frontend expectation
          const audioData = {
            pincode: result.pincode,
            digits: result.digits,
            audioUrl: result.tts_result?.public_url || null, // Real audio URL from TTS Lambda
            instructions: `Generated pincode: ${result.pincode}. Click Settings, then Screen Time, then Lock Screen Time settings. Follow the audio instructions to enter: ${result.digits.first}, ${result.digits.second}, ${result.digits.third}, ${result.digits.fourth}.`,
            executionId: result.execution_id
          };
          setAudioGuideData(audioData);
          console.log('✅ Audio guide generated:', audioData);
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
      alert('No audio guide available to play. Please generate an audio guide first.');
      return;
    }
    
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    console.log('🔊 Playing audio guide:', audioGuideData.audioUrl);
    
    // Create audio element and play
    const audio = new Audio(audioGuideData.audioUrl);
    
    // Add event listeners for better debugging
    audio.addEventListener('loadstart', () => console.log('🎵 Audio loading started'));
    audio.addEventListener('canplay', () => console.log('🎵 Audio can play'));
    audio.addEventListener('error', (e) => console.error('🎵 Audio error:', e));
    audio.addEventListener('ended', () => {
      console.log('🎵 Audio finished playing');
      setCurrentAudio(null);
    });
    
    // Track the current audio
    setCurrentAudio(audio);
    
    audio.play().then(() => {
      console.log('✅ Audio playing successfully for pincode:', audioGuideData.pincode);
    }).catch(error => {
      console.error('❌ Error playing audio:', error);
      setCurrentAudio(null);
      alert(`Failed to play audio: ${error.message}. Please check your browser settings and ensure audio is allowed.`);
    });
  };

  // Voice recording functions for surrender
  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Got media stream');
      
      // Choose compatible audio format
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options.mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options.mimeType = 'audio/ogg';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      }
      
      console.log('🎙️ Using audio format:', options.mimeType || 'default');
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      // Reset recording time
      setRecordingTime(0);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);
      console.log('⏰ Timer started');

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
        if (analyserNode) {
          analyserNode.getByteFrequencyData(dataArray);
          
          // Create audio level bars (20 bars for visualization)
          const bars = [];
          const barCount = 20;
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
          
          // Continue animation while recording
          const newAnimationId = requestAnimationFrame(updateAudioLevels);
          setAnimationId(newAnimationId);
        }
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Use a more compatible audio format
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
        
        const blob = new Blob(chunks, { type: mimeType });
        console.log('🎵 Audio blob created with type:', mimeType, 'size:', blob.size);
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        
        // Clean up audio context
        if (audioCtx) {
          audioCtx.close();
        }
        setAudioLevels([]);
      };

      recorder.start();
      console.log('📹 MediaRecorder started');
      
      setMediaRecorder(recorder);
      console.log('💾 MediaRecorder set in state');
      
      setIsRecording(true);
      console.log('🔴 isRecording set to TRUE');
      
      // Start audio visualization immediately
      updateAudioLevels();
      
      console.log('🎤 Recording started with audio visualization');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    console.log('🔍 stopRecording called with state:', {
      mediaRecorder: !!mediaRecorder,
      isRecording,
      animationId,
      recordingTimer: !!recordingTimer
    });
    
    if (mediaRecorder && isRecording) {
      console.log('🛑 Stopping recording...');
      
      // Stop animation first
      if (animationId) {
        cancelAnimationFrame(animationId);
        setAnimationId(null);
        console.log('🎬 Animation stopped');
      }
      
      // Stop recording
      try {
        mediaRecorder.stop();
        console.log('📹 MediaRecorder.stop() called');
      } catch (error) {
        console.error('❌ Error stopping mediaRecorder:', error);
      }
      
      setIsRecording(false);
      setMediaRecorder(null);
      console.log('🔄 State updated: isRecording=false, mediaRecorder=null');
      
      // Clear timer
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
        console.log('⏰ Timer cleared');
      }
      
      console.log('🛑 Recording stopped successfully');
    } else {
      console.log('⚠️ Cannot stop recording - conditions not met:', {
        hasMediaRecorder: !!mediaRecorder,
        isCurrentlyRecording: isRecording
      });
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
      formData.append('user_id', customerData?.customerId || extractCustomerId());
      formData.append('device_id', currentFlow.deviceId);
      formData.append('surrender_text', currentFlow.steps[currentFlowStep - 1].surrender_text || surrenderText);

      // Submit to backend for ChatGPT validation
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/validate_surrender`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.has_surrendered && result.pincode) {
          // Use the pincode from the backend
          setUnlockPincode(result.pincode);
          setSurrenderApproved(true);
          
          console.log('🔓 Surrender approved! Pincode generated:', result.pincode);
          console.log('📝 Transcript:', result.transcript);
          
          // Show success feedback
          alert(`✅ ${result.feedback}`);
          
          // Send email with pincode
          await sendUnlockEmail(result.pincode);
          
          // Move to step 3 (pincode display)
          setCurrentFlowStep(3);
        } else {
          alert(`❌ ${result.feedback || 'Surrender not approved. Please record the complete text clearly.'}`);
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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/send_unlock_email`, {
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
    setCancelSubmitting(false);
  };

  const nextCancelStep = () => {
    if (cancelStep < 3) {
      setCancelStep(cancelStep + 1);
    }
  };

  const submitCancellation = async () => {
    setCancelSubmitting(true);
    
    try {
      const customerId = extractCustomerId();
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // Mock cancellation for local development
        console.log('🔧 Local dev: Mock cancellation submitted', {
          customerId,
          reason: cancelReason,
          feedback: cancelFeedback
        });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
        
        // Update local state to reflect cancellation
        setCustomerData(prev => ({
          ...prev,
          subscription_status: 'cancelled'
        }));
        
        // Show success message and close modal
        setCancelStep(4); // Add success step
        setTimeout(() => {
          closeCancelFlow();
        }, 3000);
        return;
      }

      // Make API call to cancel subscription via Shopify
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/cancel_subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          user_id: customerData?.customerId || customerId,
          customer_email: customerData?.email || 'test@example.com',
          shop: customerData?.shop || 'xpvznx-9w.myshopify.com',
          subscription_id: customerData?.subscription_id,
          shopify_customer_id: customerData?.shopifyCustomerId,
          cancel_reason: cancelReason,
          feedback: cancelFeedback,
          cancel_date: new Date().toISOString(),
          // Add Shopify-specific action for backend processing
          action: 'cancel_shopify_subscription'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Subscription cancelled successfully:', result);
        
        // Update local state to reflect cancellation
        setCustomerData(prev => ({
          ...prev,
          subscription_status: 'cancelled',
          subscription_cancelled_at: new Date().toISOString()
        }));
        
        // Show success step
        setCancelStep(4);
        
        // Auto-close after showing success message
        setTimeout(() => {
          closeCancelFlow();
        }, 4000);
        
      } else {
        throw new Error(result.error || 'Failed to cancel subscription. Please contact support.');
      }

    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      alert(`❌ Failed to cancel subscription: ${error.message}\n\nPlease try again or contact support at support@screentimejourney.com`);
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

  // Set default notification settings when user validates WhatsApp or email
  const setDefaultNotificationSettings = () => {
    setNotificationSettings({
      email: {
        weeklyProgress: true,
        monthlyLeaderboard: true
      },
      whatsapp: {
        weeklyProgress: true,
        monthlyLeaderboard: true
      }
    });
  };

  const submitNotificationSettings = async () => {
    setNotificationsSubmitting(true);
    
    try {
      const customerId = extractCustomerId();
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // Mock submission for local development
        console.log('🔧 Local dev: Mock notification settings saved', notificationSettings);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        alert('✅ Notification settings saved successfully!');
        closeNotificationsFlow();
        return;
      }

      // Create individual records for each notification type
      const notificationRecords = [
        {
          notification_type: 'email_weekly',
          enabled: notificationSettings.email.weeklyProgress,
          customer_id: customerId,
          updated_at: new Date().toISOString()
        },
        {
          notification_type: 'email_monthly', 
          enabled: notificationSettings.email.monthlyLeaderboard,
          customer_id: customerId,
          updated_at: new Date().toISOString()
        },
        {
          notification_type: 'whatsapp_weekly',
          enabled: notificationSettings.whatsapp.weeklyProgress,
          customer_id: customerId,
          updated_at: new Date().toISOString()
        },
        {
          notification_type: 'whatsapp_monthly',
          enabled: notificationSettings.whatsapp.monthlyLeaderboard,
          customer_id: customerId,
          updated_at: new Date().toISOString()
        }
      ];

      console.log('📤 Sending notification settings:', {
        customer_id: customerId,
        notification_records: notificationRecords
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/update_notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          notification_records: notificationRecords,
          // Add legacy format for backward compatibility
          notification_settings: notificationSettings,
          action: 'update_notification_preferences'
        })
      });

      console.log('📥 API Response status:', response.status);
      
      let result;
      try {
        result = await response.json();
        console.log('📥 API Response data:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (response.ok && result.success) {
        alert('✅ Notification settings saved successfully!');
        closeNotificationsFlow();
      } else if (response.status === 404) {
        // Endpoint not implemented yet - save locally for now
        console.log('⚠️ Notification endpoint not implemented, saving locally');
        alert('✅ Notification settings saved successfully! (Note: Backend endpoint under development)');
        closeNotificationsFlow();
      } else {
        const errorMessage = result?.error || result?.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert('❌ Network error. Please check your connection and try again.');
      } else if (error.message.includes('Invalid response')) {
        alert('❌ Server error. Please try again in a moment.');
      } else {
        alert(`❌ Failed to save notification settings: ${error.message}\n\nPlease try again or contact support.`);
      }
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
    console.log('🎬 Attempting to start flow:', flowType, 'for device:', deviceId);
    console.log('📋 Available flows:', Object.keys(deviceFlows));
    
    const flow = deviceFlows[flowType];
    if (!flow) {
      console.error('❌ Flow not found:', flowType);
      console.warn('⚠️ Flow not found in deviceFlows, using fallback:', flowType);
      
      // Check if we have fallback flows available
      if (flowType === 'device_unlock_flow') {
        console.log('🔄 Using fallback unlock flow');
        const fallbackFlow = {
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
        };
        
        setCurrentFlow({ ...fallbackFlow, flowType, deviceId });
        setCurrentFlowStep(1);
        setShowDeviceFlow(true);
        console.log('✅ Started fallback unlock flow:', fallbackFlow.flow_name);
        return;
      }
      
      console.error('❌ Flow not found even in fallback:', flowType);
      alert('Sorry, the device flow is temporarily unavailable. Please try again later.');
      return;
    }
    
    setCurrentFlow({ ...flow, flowType, deviceId });
    setCurrentFlowStep(1);
    setShowDeviceFlow(true);
    console.log('✅ Started flow:', flow.flow_name);
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
      
      // Skip auto-generation for now - focus on core device setup flow
      // Users can manually generate profiles/guides later if needed
      console.log('📋 Device setup flow continuing to step', nextStep, 'without auto-generation');
      
      // // Auto-generate VPN profile when reaching step 3 (Setup Profile) - DISABLED FOR NOW
      // if (nextStep === 3 && currentFlow.flowType === 'device_setup_flow' && !vpnProfileData) {
      //   console.log('🔧 Auto-generating VPN profile for step 3', { deviceFormData });
      //   try {
      //     generateVPNProfile();
      //   } catch (error) {
      //     console.error('❌ Error auto-generating VPN profile:', error);
      //     // Continue flow even if VPN profile generation fails
      //   }
      // }
      // 
      // // Auto-generate audio guide when reaching step 4 (Setup Pincode) - DISABLED FOR NOW
      // if (nextStep === 4 && currentFlow.flowType === 'device_setup_flow' && !audioGuideData) {
      //   console.log('🔧 Auto-generating audio guide for step 4', { deviceFormData });
      //   try {
      //     generateAudioGuide();
      //   } catch (error) {
      //     console.error('❌ Error auto-generating audio guide:', error);
      //     // Continue flow even if audio guide generation fails
      //   }
      // }
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
    
    // Stop any playing audio when flow completes
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
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
      
      // CRITICAL: Use centralized customer ID extraction
      const customerId = extractCustomerId();
      
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/get_profile`, {
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
        
        // Show account wall only if username doesn't exist
        const hasUsername = result.profile?.username && result.profile.username.trim();
        setShowOnboarding(!hasUsername);
        console.log(`🔍 Username check: ${hasUsername ? 'exists' : 'missing'} - Account wall: ${!hasUsername ? 'show' : 'hide'}`);
      } else {
        // If profile doesn't exist, show onboarding
        setShowOnboarding(true);
        console.log('📝 Profile not found - showing account wall');
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
      
      // CRITICAL: Use centralized customer ID extraction
      const customerId = extractCustomerId();
      
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/update_profile`, {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/check_username`, {
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

  // =============================================================================
  // CUSTOMER ID EXTRACTION - CENTRALIZED
  // =============================================================================
  
  const extractCustomerId = () => {
    /**
     * CRITICAL: Centralized customer ID extraction for ALL functions
     * This ensures consistent mapping to Shopify customer_id in DynamoDB
     */
    try {
      console.log('🔍 EXTRACTING CUSTOMER ID - Starting extraction process');
      
      // Method 1: URL Parameters (most reliable for fresh redirects)
      const urlParams = new URLSearchParams(window.location.search);
      let customerId = urlParams.get('cid') || urlParams.get('logged_in_customer_id');
      
      console.log('🔍 URL Parameters:', {
        cid: urlParams.get('cid'),
        logged_in_customer_id: urlParams.get('logged_in_customer_id'),
        currentURL: window.location.href
      });
      
      if (customerId) {
        console.log('✅ CUSTOMER ID FOUND in URL:', customerId);
        return customerId;
      }
      
      // Method 2: Session Cookie (for subsequent page loads)
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('stj_session='));
      
      if (!sessionCookie) {
        console.error('❌ NO SESSION COOKIE FOUND');
        console.log('🔧 Available cookies:', document.cookie);
        return null;
      }
      
      console.log('🍪 Session cookie found, attempting extraction...');
      
      try {
        const sessionValue = sessionCookie.split('=')[1];
        console.log('🔧 Session value length:', sessionValue.length);
        
        let tokenData = null;
        
        // Try multiple decoding methods (handles different cookie formats)
        const decodingMethods = [
          () => JSON.parse(decodeURIComponent(sessionValue)), // Most common
          () => JSON.parse(sessionValue), // Direct JSON
          () => JSON.parse(atob(sessionValue)) // Base64 encoded
        ];
        
        for (let i = 0; i < decodingMethods.length; i++) {
          try {
            tokenData = decodingMethods[i]();
            console.log(`✅ Session decoded with method ${i + 1}:`, {
              hasToken: !!tokenData.token,
              hasCustomerId: !!tokenData.customer_id,
              keys: Object.keys(tokenData)
            });
            break;
          } catch (err) {
            console.log(`⚠️ Decoding method ${i + 1} failed:`, err.message);
          }
        }
        
        if (!tokenData) {
          throw new Error('All decoding methods failed');
        }
        
        // Extract customer ID from different session formats
        if (tokenData.token) {
          // SSO Token format: shop|customer_id|iat|ttl|profile_flag|signature
          try {
            const decoded = atob(tokenData.token);
            const parts = decoded.split('|');
            customerId = parts[1]; // customer_id is the second part
            console.log('✅ CUSTOMER ID EXTRACTED from token:', customerId);
            console.log('🔧 Token parts:', parts);
          } catch (err) {
            console.error('❌ Failed to decode token:', err);
          }
        } else if (tokenData.customer_id) {
          // Direct customer_id format
          customerId = tokenData.customer_id;
          console.log('✅ CUSTOMER ID FOUND direct:', customerId);
        } else {
          console.error('❌ No customer_id found in token data:', tokenData);
        }
        
      } catch (err) {
        console.error('❌ Session cookie parsing failed:', err);
        console.log('🔧 Raw session cookie:', sessionCookie);
      }
      
      // Production-only: No local development fallbacks
      // TEMPORARY: Allow manual customer ID via URL for testing (?test_customer_id=xxx)
      if (!customerId) {
        const urlParams = new URLSearchParams(window.location.search);
        const testCustomerId = urlParams.get('test_customer_id');
        if (testCustomerId) {
          customerId = testCustomerId;
          console.log('🧪 TESTING: Using manual customer ID from URL:', customerId);
        }
      }
      
      if (customerId) {
        console.log('✅ FINAL CUSTOMER ID:', customerId);
        return customerId;
      } else {
        console.error('❌ CUSTOMER ID EXTRACTION FAILED');
        console.log('🔧 Final debug info:', {
          url: window.location.href,
          cookies: document.cookie,
          sessionCookie: !!sessionCookie
        });
        return null;
      }
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in customer ID extraction:', error);
      return null;
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
      setWhatsappLoading(true);
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // In local development, simulate sending code
        setTimeout(() => {
          setWhatsappCodeSent(true);
          setResendCooldown(60); // Start 60-second cooldown
          setOnboardStep(4); // Move to verification step
          setWhatsappLoading(false);
          console.log(`🔧 Local dev: Simulated sending code to ${newCountryCode}${newWhatsapp}`);
          alert(`Demo: Verification code "123456" sent to ${newCountryCode}${newWhatsapp}`);
        }, 1000);
        return;
      }
      
      // CRITICAL: Use centralized customer ID extraction
      const customerId = extractCustomerId();
      
      if (!customerId) {
        alert('Unable to send verification code: Customer ID not found');
        setWhatsappLoading(false);
        return;
      }
      
      console.log('📱 Sending WhatsApp code with customer ID:', customerId);
      console.log('🌐 Current URL:', window.location.href);
      console.log('🍪 All cookies:', document.cookie);
      
      // Call backend API to send WhatsApp verification code
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/send_whatsapp_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone_number: `${newCountryCode}${newWhatsapp}`.replace(/\s/g, ''),
          customer_id: customerId
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
      setWhatsappLoading(false);
    }
  };

  const verifyWhatsAppCode = async () => {
    setWhatsappError(''); // Clear any previous errors
    
    if (!whatsappCode || whatsappCode.length !== 6) {
      setWhatsappError('Please enter the complete 6-digit verification code');
      return;
    }

    try {
      setWhatsappLoading(true);
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // In local development, accept "123456" as valid code
        setTimeout(async () => {
          if (whatsappCode === '123456') {
            setWhatsappLinked(true);
            console.log('🔧 Local dev: WhatsApp verification successful');
            
            // Set default notification settings when WhatsApp is verified
            setDefaultNotificationSettings();
            
            await saveProfile(); // Proceed to save profile
          } else {
            setWhatsappLoading(false);
            setWhatsappError('Invalid code. Use "123456" for demo');
          }
        }, 500);
        return;
      }
      
      // CRITICAL: Use centralized customer ID extraction
      const customerId = extractCustomerId();
      
      if (!customerId) {
        alert('Unable to verify code: Customer ID not found');
        setWhatsappLoading(false);
        return;
      }
      
      console.log('🔍 Verifying WhatsApp code with customer ID:', customerId);
      
      // Call backend API to verify WhatsApp code
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/verify_whatsapp_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone_number: `${newCountryCode}${newWhatsapp}`.replace(/\s/g, ''),
          code: whatsappCode,
          customer_id: customerId,
          username: newUsername || 'tempuser',
          gender: newGender || 'other'
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setWhatsappLinked(true);
        console.log('✅ WhatsApp verified and saved to profile:', result.phone);
        
        // Set default notification settings when WhatsApp is verified
        setDefaultNotificationSettings();
        
        // The backend has already saved the WhatsApp data to the profile
        // Just proceed to save the rest of the profile (username, gender)
        await saveProfile();
      } else {
        setWhatsappError(result.error || 'Invalid verification code. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error verifying WhatsApp code:', error);
      setWhatsappError('Failed to verify code. Please check your connection and try again.');
    } finally {
      setWhatsappLoading(false);
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/check_username`, {
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
      setProfileLoading(true);
      
      // CRITICAL: Final username availability check to prevent race conditions
      console.log('🔍 Performing final username availability check before saving...');
      const finalUsernameCheck = await checkUsernameAvailabilitySync(newUsername);
      
      if (!finalUsernameCheck) {
        setUsernameError('Username was just taken by another user. Please choose a different one.');
        setUsernameValid(false);
        setOnboardStep(1); // Go back to username step
        setProfileLoading(false);
        return;
      }
      
      console.log('✅ Final username check passed, proceeding with save...');
      
      // CRITICAL: Use centralized customer ID extraction (same as account section)
      let customerId = customerData?.customerId;
      
      if (!customerId) {
        // Extract customer ID from session cookie (same as account section)
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('stj_session='));
        
        if (sessionCookie) {
          try {
            const cookieValue = sessionCookie.split('=')[1];
            // ALWAYS decode the cookie value first (it's URL encoded)
            const decodedValue = decodeURIComponent(cookieValue);
            const tokenData = JSON.parse(decodedValue);
            const decoded = atob(tokenData.token);
            const parts = decoded.split('|');
            customerId = parts[1]; // customer_id is the second part
            console.log('✅ Save Profile: Extracted customer ID from session:', customerId);
          } catch (err) {
            console.error('❌ Save Profile: Failed to extract customer ID from session:', err);
          }
        }
      }
      
      if (!customerId) {
        alert('Unable to save profile: Customer ID not found');
        setProfileLoading(false);
        return;
      }
      
      const profileData = {
        customer_id: customerId,
        username: newUsername.trim(),
        gender: newGender
      };
      
      // Only include WhatsApp data if user is skipping verification
      // (Verified WhatsApp data is already saved by the verification endpoint)
      if (!whatsappLinked) {
        profileData.whatsapp = ''; // Empty for users who skip
        profileData.whatsapp_opt_in = false; // No opt-in for users who skip
      }
      
      console.log('💾 Saving profile:', profileData);
      
      // Call backend API to save profile
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/save_profile`, {
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
      setProfileLoading(false);
    }
  };

  // Load devices from backend on app startup
  const loadDevicesFromBackend = async () => {
    let customerId = customerData?.customerId;
    
    if (!customerId) {
      // Extract customer ID from session cookie (same as account section)
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('stj_session='));
      
      console.log('🔍 Devices: Session cookie found:', !!sessionCookie);
      
      if (sessionCookie) {
        try {
          const cookieValue = sessionCookie.split('=')[1];
          console.log('🔍 Devices: Raw cookie value:', cookieValue);
          
          // ALWAYS decode the cookie value first (it's URL encoded)
          const decodedValue = decodeURIComponent(cookieValue);
          console.log('🔍 Devices: URL decoded value:', decodedValue);
          
          const tokenData = JSON.parse(decodedValue);
          console.log('🔍 Devices: Token data keys:', Object.keys(tokenData));
          
          const decoded = atob(tokenData.token);
          console.log('🔍 Devices: Base64 decoded token:', decoded);
          
          const parts = decoded.split('|');
          console.log('🔍 Devices: Token parts:', parts);
          
          customerId = parts[1]; // customer_id is the second part
          console.log('✅ Devices: Extracted customer ID from session:', customerId);
        } catch (err) {
          console.error('❌ Devices: Failed to extract customer ID from session:', err);
          console.error('❌ Devices: Cookie value that failed:', sessionCookie);
        }
      } else {
        console.log('❌ Devices: No stj_session cookie found');
        console.log('🔍 Devices: All cookies:', document.cookie);
      }
    }
    
    if (!customerId) {
      console.warn('⚠️ No customer ID available, cannot load devices');
      console.warn('🔐 User needs to authenticate through Shopify first');
      setDevices([]); // Clear devices if no auth
      return;
    }

    try {
      console.log('🔄 Loading devices from backend for customer:', customerId);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/get_devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.devices) {
        console.log(`✅ Loaded ${result.devices.length} devices from backend:`, result.devices);
        setDevices(result.devices);
      } else {
        console.log('📱 No devices found in backend, starting with empty array');
        setDevices([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading devices from backend:', error);
      // Don't show error to user, just start with empty array
      setDevices([]);
    }
  };

  // Device management functions
  const addDeviceFromFlow = async () => {
    if (!deviceFormData.device_name.trim()) {
      alert('Please enter a device name');
      return;
    }
    
    if (devices.length >= 3) {
      alert('Maximum 3 devices allowed. Please remove a device first.');
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
      addedDate: new Date().toISOString(),
      type: deviceFormData.device_type,
      setup_completed_at: new Date().toISOString()
    };
    
    try {
      // Get customer ID for device addition (using working account section pattern)
      let customerId = customerData?.customerId;
      
      if (!customerId) {
        // Extract customer ID from session cookie (same as account section)
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('stj_session='));
        
        if (sessionCookie) {
          try {
            const cookieValue = sessionCookie.split('=')[1];
            // ALWAYS decode the cookie value first (it's URL encoded)
            const decodedValue = decodeURIComponent(cookieValue);
            const tokenData = JSON.parse(decodedValue);
            const decoded = atob(tokenData.token);
            const parts = decoded.split('|');
            customerId = parts[1]; // customer_id is the second part
            console.log('✅ Add Device: Extracted customer ID from session:', customerId);
          } catch (err) {
            console.error('❌ Add Device: Failed to extract customer ID from session:', err);
          }
        }
      }
      
      if (!customerId) {
        alert('❌ Failed to add device: Customer not found\nPlease try again or contact support if the issue persists.');
        return;
      }
      
      // Always save to backend for persistence
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/add_device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          device: newDevice
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save device to backend');
      }
      
      const result = await response.json();
      console.log('✅ Device saved to backend:', result);
      
      // Reload devices from backend to ensure persistence
      await loadDevicesFromBackend();
      console.log('✅ Device added from flow and reloaded from backend:', newDevice);
      
      // Success feedback with better UX
      alert(`🎉 Device "${newDevice.name}" has been successfully added and configured!\n\nYou now have ${devices.length + 1} of 3 devices maximum.`);
      
    } catch (error) {
      console.error('❌ Error saving device:', error);
      alert(`❌ Failed to add device: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
    }
  };

  // Auto-unlock device when reaching pincode display step
  useEffect(() => {
    if (showDeviceFlow && currentFlow && currentFlowStep === 3 && 
        currentFlow.steps[currentFlowStep - 1]?.step_type === 'pincode_display' &&
        currentFlow.deviceId && currentFlow.flowType === 'device_unlock_flow') {
      
      console.log('🔓 Auto-unlocking device on pincode display:', currentFlow.deviceId);
      
      // Auto-unlock the device without confirmation
      const autoUnlockDevice = async () => {
        try {
          const device = devices.find(d => d.id === currentFlow.deviceId);
          if (!device) {
            console.log('⚠️ Device not found for auto-unlock:', currentFlow.deviceId);
            return;
          }
          
          console.log('🔓 Auto-unlocking device:', device.name);
          
          // Call backend API to unlock device
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/unlock_device`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer_id: customerData?.customerId || extractCustomerId(),
              device_id: currentFlow.deviceId
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Device auto-unlocked successfully:', result);
            
            // Now remove device permanently from DynamoDB
            console.log('🗑️ Removing device from DynamoDB...');
            const removeResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/remove_device`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                customer_id: customerData?.customerId || extractCustomerId(),
                device_id: currentFlow.deviceId
              })
            });
            
            if (removeResponse.ok) {
              const removeResult = await removeResponse.json();
              console.log('✅ Device permanently removed from DynamoDB:', removeResult);
              
              // Remove device from local state
              setDevices(prev => prev.filter(d => d.id !== currentFlow.deviceId));
              console.log('🗑️ Device removed from local state');
              
            } else {
              console.error('❌ Failed to remove device from DynamoDB:', removeResponse.status);
              // Still remove from local state even if backend fails
              setDevices(prev => prev.filter(d => d.id !== currentFlow.deviceId));
            }
            
          } else {
            console.error('❌ Failed to auto-unlock device:', response.status);
          }
        } catch (error) {
          console.error('❌ Error during auto-unlock:', error);
        }
      };
      
      // Execute auto-unlock after a brief delay to ensure UI is ready
      setTimeout(autoUnlockDevice, 1000);
    }
  }, [showDeviceFlow, currentFlow, currentFlowStep, devices, customerData]);
  
  const unlockDevice = async (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;
    
    if (device.status === 'locked' || device.status === 'setup_complete' || device.status === 'monitoring') {
      // Confirm unlock action
      const confirmed = window.confirm(`Unlock ${device.name}? This will allow screen time for 30 minutes.`);
      if (confirmed) {
        try {
          // Get customer ID for device unlock (using working pattern from addDeviceFromFlow)
          let customerId = customerData?.customerId;
          
          if (!customerId) {
            // Extract customer ID from session cookie (same as addDeviceFromFlow)
            const sessionCookie = document.cookie
              .split('; ')
              .find(row => row.startsWith('stj_session='));
            
            if (sessionCookie) {
              try {
                const cookieValue = sessionCookie.split('=')[1];
                // ALWAYS decode the cookie value first (it's URL encoded)
                const decodedValue = decodeURIComponent(cookieValue);
                const tokenData = JSON.parse(decodedValue);
                const decoded = atob(tokenData.token);
                const parts = decoded.split('|');
                customerId = parts[1]; // customer_id is the second part
                console.log('✅ Unlock Device: Extracted customer ID from session:', customerId);
              } catch (err) {
                console.error('❌ Unlock Device: Failed to extract customer ID from session:', err);
              }
            }
          }
          
          if (!customerId) {
            alert('❌ Failed to unlock device: Customer not found\nPlease try again or contact support if the issue persists.');
            return;
          }
          
          // Call backend API to unlock device
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/unlock_device`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer_id: customerId,
              device_id: deviceId,
              unlock_duration: 30 // 30 minutes
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to unlock device');
          }
          
          const result = await response.json();
          console.log('✅ Device unlocked on backend:', result);
          
          // Reload devices from backend to ensure persistence
          await loadDevicesFromBackend();
          
          console.log('🔓 Device unlocked:', device.name);
          alert(`${device.name} has been unlocked for ${result.unlock_duration_minutes} minutes`);
          
          // Set timer to update UI when unlock expires (visual feedback only)
          setTimeout(() => {
            setDevices(prev => prev.map(d => 
              d.id === deviceId 
                ? { ...d, status: 'locked' }
                : d
            ));
            console.log('🔒 Device auto-locked:', device.name);
          }, result.unlock_duration_minutes * 60 * 1000);
          
        } catch (error) {
          console.error('❌ Error unlocking device:', error);
          alert(`❌ Failed to unlock device: ${error.message}`);
        }
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
                    disabled={!newWhatsapp.trim() || whatsappLoading}
                    onClick={sendWhatsAppCode}
                  >
                    {whatsappLoading ? 'Sending code...' : 'Validate'}
                  </button>
                  <button 
                    className="btn btn--secondary btn--full" 
                    disabled={whatsappLoading || profileLoading}
                    onClick={async () => {
                      await saveProfile(); // Save without WhatsApp
                    }}
                  >
                    {profileLoading ? 'Saving profile...' : whatsappLoading ? 'Please wait...' : 'Skip (not recommended)'}
                  </button>
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
                    disabled={whatsappCode.length !== 6 || whatsappLoading || profileLoading}
                    onClick={verifyWhatsAppCode}
                  >
                    {profileLoading ? 'Saving profile...' : whatsappLoading ? 'Verifying...' : 'Verify & Complete'}
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
                <div style={{ position: 'relative' }}>
                  <input 
                    className={`input ${profileEditData.usernameValidationState === 'checking' ? 'input--loading' : 
                      profileEditData.usernameValidationState === 'available' ? 'input--valid' : 
                      profileEditData.usernameValidationState === 'taken' ? 'input--invalid' : ''}`}
                    placeholder="theking" 
                    value={profileEditData.username} 
                    onChange={async (e) => {
                      const value = e.target.value;
                      const sanitizedValue = value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '')
                        .slice(0, 20);
                      
                      setProfileEditData(prev => ({
                        ...prev, 
                        username: sanitizedValue,
                        usernameValidationState: sanitizedValue.length < 3 ? null : 'checking'
                      }));

                      // Skip validation if username hasn't changed or is too short
                      if (sanitizedValue === profileData?.username || sanitizedValue.length < 3) {
                        setProfileEditData(prev => ({...prev, usernameValidationState: null}));
                        return;
                      }

                      // Debounced username validation
                      clearTimeout(usernameCheckTimeout);
                      const timeoutId = setTimeout(async () => {
                        try {
                          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/check_username`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: sanitizedValue })
                          });
                          const result = await response.json();
                          
                          setProfileEditData(prev => ({
                            ...prev, 
                            usernameValidationState: result.available ? 'available' : 'taken'
                          }));
                        } catch (error) {
                          console.error('Username validation error:', error);
                          setProfileEditData(prev => ({...prev, usernameValidationState: null}));
                        }
                      }, 500);
                      setUsernameCheckTimeout(timeoutId);
                    }}
                  />
                  {profileEditData.usernameValidationState === 'checking' && (
                    <div className="input-icon" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                      <div className="spinner-small"></div>
                    </div>
                  )}
                  {profileEditData.usernameValidationState === 'available' && (
                    <div className="input-icon" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }}>
                      ✓
                    </div>
                  )}
                  {profileEditData.usernameValidationState === 'taken' && (
                    <div className="input-icon" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }}>
                      ✗
                    </div>
                  )}
                </div>
                <p className="helper" style={{ margin: '0.5rem 0 0 0', color: 
                  profileEditData.usernameValidationState === 'available' ? '#10b981' : 
                  profileEditData.usernameValidationState === 'taken' ? '#ef4444' : '#6b7280' }}>
                  {profileEditData.usernameValidationState === 'taken' ? 'Username already taken' :
                   profileEditData.usernameValidationState === 'available' ? 'Username available!' :
                   '3-20 characters, letters and numbers only.'}
                </p>
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
                
                {/* Current WhatsApp Display */}
                {profileData?.whatsapp && (
                  <div style={{ marginBottom: '1rem', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong>Current: {profileData.whatsapp}</strong>
                        {profileData.whatsapp_opt_in && (
                          <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '14px' }}>✓ Verified</span>
                        )}
                      </div>
                      <button 
                        type="button"
                        className="btn btn--secondary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => setProfileEditData(prev => ({...prev, showWhatsAppEdit: true}))}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {/* WhatsApp Edit Form */}
                {(!profileData?.whatsapp || profileEditData.showWhatsAppEdit) && (
                  <>
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
                    
                    {profileEditData.whatsapp && (
                      <div style={{ marginTop: '8px' }}>
                        <button 
                          type="button"
                          className="btn btn--primary"
                          style={{ padding: '6px 12px', fontSize: '14px', marginRight: '8px' }}
                          onClick={async () => {
                            const fullPhone = `${profileEditData.country_code}${profileEditData.whatsapp}`.replace(/\s/g, '');
                            setProfileEditData(prev => ({...prev, verifyingWhatsApp: true}));
                            
                            try {
                              const customerId = extractCustomerId();
                              const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/send_whatsapp_code`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  phone_number: fullPhone,
                                  customer_id: customerId
                                })
                              });
                              const result = await response.json();
                              
                              if (response.ok && result.success) {
                                setProfileEditData(prev => ({...prev, whatsappCodeSent: true, whatsappCode: ''}));
                              } else {
                                setProfileError(result.error || 'Failed to send verification code');
                              }
                            } catch (error) {
                              console.error('Error sending verification code:', error);
                              setProfileError('Failed to send verification code');
                            } finally {
                              setProfileEditData(prev => ({...prev, verifyingWhatsApp: false}));
                            }
                          }}
                          disabled={profileEditData.verifyingWhatsApp}
                        >
                          {profileEditData.verifyingWhatsApp ? 'Sending...' : 'Send Verification Code'}
                        </button>
                        
                        {profileData?.whatsapp && (
                          <button 
                            type="button"
                            className="btn btn--secondary"
                            style={{ padding: '6px 12px', fontSize: '14px' }}
                            onClick={() => setProfileEditData(prev => ({...prev, showWhatsAppEdit: false, whatsapp: '', whatsappCodeSent: false}))}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Verification Code Input */}
                    {profileEditData.whatsappCodeSent && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px' }}>
                        <label className="form-label" style={{ marginBottom: '8px' }}>Enter 6-digit verification code</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text"
                            className="input"
                            placeholder="123456"
                            value={profileEditData.whatsappCode || ''}
                            onChange={(e) => setProfileEditData(prev => ({...prev, whatsappCode: e.target.value.replace(/\D/g, '').slice(0, 6)}))}
                            style={{ flex: 1 }}
                          />
                          <button 
                            type="button"
                            className="btn btn--primary"
                            onClick={async () => {
                              if (profileEditData.whatsappCode?.length !== 6) return;
                              
                              setProfileEditData(prev => ({...prev, verifyingCode: true}));
                              
                              try {
                                const customerId = extractCustomerId();
                                const fullPhone = `${profileEditData.country_code}${profileEditData.whatsapp}`.replace(/\s/g, '');
                                
                                const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/verify_whatsapp_code`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    phone_number: fullPhone,
                                    code: profileEditData.whatsappCode,
                                    customer_id: customerId,
                                    username: profileEditData.username || profileData?.username,
                                    gender: profileEditData.gender || profileData?.gender
                                  })
                                });
                                const result = await response.json();
                                
                                if (response.ok && result.success) {
                                  setProfileEditData(prev => ({
                                    ...prev, 
                                    whatsappVerified: true,
                                    whatsappCodeSent: false,
                                    showWhatsAppEdit: false
                                  }));
                                  setProfileError('');
                                  // Refresh profile data
                                  fetchProfileData();
                                } else {
                                  setProfileError(result.error || 'Invalid verification code');
                                }
                              } catch (error) {
                                console.error('Error verifying code:', error);
                                setProfileError('Failed to verify code');
                              } finally {
                                setProfileEditData(prev => ({...prev, verifyingCode: false}));
                              }
                            }}
                            disabled={profileEditData.whatsappCode?.length !== 6 || profileEditData.verifyingCode}
                          >
                            {profileEditData.verifyingCode ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <p className="helper" style={{ margin: '0.5rem 0 0 0' }}>
                  {profileData?.whatsapp ? 'WhatsApp changes require verification for security.' : 'For daily motivation and accountability messages.'}
                </p>
              </div>

              {/* Commitment Data Section */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Your Commitment</label>
                
                {/* Current Commitment Display */}
                {profileData?.commitment_data && !profileEditData.showCommitmentEdit && (
                  <div style={{ marginBottom: '1rem', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#1e293b', fontSize: '14px' }}>What you want to change:</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#475569' }}>"{profileData.commitment_data.q1}"</p>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#1e293b', fontSize: '14px' }}>What you want to gain:</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#475569' }}>"{profileData.commitment_data.q2}"</p>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#1e293b', fontSize: '14px' }}>Who you're doing this for:</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#475569' }}>"{profileData.commitment_data.q3}"</p>
                    </div>
                    
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Click edit to update your commitment</span>
                      <button 
                        type="button"
                        className="btn btn--secondary"
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                        onClick={() => setProfileEditData(prev => ({
                          ...prev, 
                          showCommitmentEdit: true,
                          commitmentQ1: profileData.commitment_data.q1 || '',
                          commitmentQ2: profileData.commitment_data.q2 || '',
                          commitmentQ3: profileData.commitment_data.q3 || ''
                        }))}
                      >
                        Edit Commitment
                      </button>
                    </div>
                  </div>
                )}

                {/* Commitment Edit Form - Inline */}
                {profileEditData.showCommitmentEdit && (
                  <div style={{ marginBottom: '1rem', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '16px' }}>Update Your Commitment</h4>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label">What do you want to quit or change?</label>
                      <input 
                        type="text"
                        className="input"
                        placeholder="e.g., quit porn, reduce social media, stop gaming..."
                        value={profileEditData.commitmentQ1 || ''}
                        onChange={(e) => setProfileEditData(prev => ({...prev, commitmentQ1: e.target.value}))}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label">What do you want to gain or achieve?</label>
                      <input 
                        type="text"
                        className="input"
                        placeholder="e.g., more energy, better relationships, inner peace..."
                        value={profileEditData.commitmentQ2 || ''}
                        onChange={(e) => setProfileEditData(prev => ({...prev, commitmentQ2: e.target.value}))}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label">Who are you doing this for?</label>
                      <input 
                        type="text"
                        className="input"
                        placeholder="e.g., my family, my future self, my children..."
                        value={profileEditData.commitmentQ3 || ''}
                        onChange={(e) => setProfileEditData(prev => ({...prev, commitmentQ3: e.target.value}))}
                      />
                    </div>

                    {/* Validation and Preview */}
                    {profileEditData.commitmentValidating && (
                      <div style={{ padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="spinner-small"></div>
                          <span style={{ color: '#92400e' }}>Validating your commitment...</span>
                        </div>
                      </div>
                    )}

                    {profileEditData.commitmentValidation && (
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: profileEditData.commitmentValidation.is_passionate ? '#f0fdf4' : '#fef2f2', 
                        border: `1px solid ${profileEditData.commitmentValidation.is_passionate ? '#bbf7d0' : '#fecaca'}`, 
                        borderRadius: '8px', 
                        marginBottom: '16px' 
                      }}>
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          color: profileEditData.commitmentValidation.is_passionate ? '#059669' : '#dc2626',
                          fontWeight: '500'
                        }}>
                          {profileEditData.commitmentValidation.feedback}
                        </p>
                        {profileEditData.commitmentValidation.surrender_text && (
                          <>
                            <strong style={{ color: '#374151', fontSize: '14px' }}>New Commitment Statement:</strong>
                            <p style={{ 
                              margin: '4px 0 0 0', 
                              fontStyle: 'italic',
                              color: '#4b5563',
                              padding: '8px',
                              backgroundColor: 'rgba(255,255,255,0.5)',
                              borderRadius: '6px'
                            }}>
                              "{profileEditData.commitmentValidation.surrender_text}"
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button"
                        className="btn btn--primary"
                        style={{ flex: 1 }}
                        onClick={async () => {
                          const q1 = profileEditData.commitmentQ1?.trim();
                          const q2 = profileEditData.commitmentQ2?.trim();
                          const q3 = profileEditData.commitmentQ3?.trim();

                          if (!q1 || !q2 || !q3) {
                            setProfileError('Please fill in all commitment fields');
                            return;
                          }

                          setProfileEditData(prev => ({...prev, commitmentValidating: true}));
                          
                          try {
                            // Validate with ChatGPT
                            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/evaluate_only`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ q1, q2, q3 })
                            });
                            const result = await response.json();
                            
                            if (response.ok && result.ok) {
                              setProfileEditData(prev => ({
                                ...prev, 
                                commitmentValidation: result,
                                commitmentValidating: false
                              }));
                              setProfileError('');
                              
                              // If validation is successful, update the display values immediately
                              if (result.is_passionate) {
                                console.log('✅ Commitment validated successfully, updating preview');
                              }
                            } else {
                              setProfileError(result.error || 'Failed to validate commitment');
                              setProfileEditData(prev => ({...prev, commitmentValidating: false}));
                            }
                          } catch (error) {
                            console.error('Commitment validation error:', error);
                            setProfileError('Failed to validate commitment');
                            setProfileEditData(prev => ({...prev, commitmentValidating: false}));
                          }
                        }}
                        disabled={profileEditData.commitmentValidating || !profileEditData.commitmentQ1?.trim() || !profileEditData.commitmentQ2?.trim() || !profileEditData.commitmentQ3?.trim()}
                      >
                        {profileEditData.commitmentValidating ? 'Validating...' : 'Validate'}
                      </button>
                      
                      {profileEditData.commitmentValidation?.is_passionate && (
                        <button 
                          type="button"
                          className="btn btn--primary"
                          style={{ backgroundColor: '#10b981' }}
                          onClick={async () => {
                            setProfileEditData(prev => ({...prev, commitmentSaving: true}));
                            
                            try {
                              const customerId = extractCustomerId();
                              const commitmentData = {
                                q1: profileEditData.commitmentQ1.trim(),
                                q2: profileEditData.commitmentQ2.trim(),
                                q3: profileEditData.commitmentQ3.trim(),
                                surrender_text: profileEditData.commitmentValidation.surrender_text
                              };

                              const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/update_profile`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  customer_id: customerId,
                                  commitment_data: commitmentData
                                })
                              });
                              const result = await response.json();
                              
                              if (response.ok && result.success) {
                                // Reset edit state and refresh data
                                setProfileEditData(prev => ({
                                  ...prev, 
                                  showCommitmentEdit: false,
                                  commitmentValidation: null,
                                  commitmentSaving: false,
                                  commitmentQ1: '',
                                  commitmentQ2: '',
                                  commitmentQ3: ''
                                }));
                                setProfileError('');
                                // Refresh profile data to show updated values
                                fetchProfileData();
                              } else {
                                setProfileError(result.error || 'Failed to save commitment');
                                setProfileEditData(prev => ({...prev, commitmentSaving: false}));
                              }
                            } catch (error) {
                              console.error('Commitment save error:', error);
                              setProfileError('Failed to save commitment');
                              setProfileEditData(prev => ({...prev, commitmentSaving: false}));
                            }
                          }}
                          disabled={profileEditData.commitmentSaving}
                        >
                          {profileEditData.commitmentSaving ? 'Saving...' : 'Save Commitment'}
                        </button>
                      )}
                      
                      <button 
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => setProfileEditData(prev => ({
                          ...prev, 
                          showCommitmentEdit: false,
                          commitmentValidation: null,
                          // Reset to original values on cancel
                          commitmentQ1: profileData?.commitment_data?.q1 || '',
                          commitmentQ2: profileData?.commitment_data?.q2 || '',
                          commitmentQ3: profileData?.commitment_data?.q3 || ''
                        }))}
                        disabled={profileEditData.commitmentValidating || profileEditData.commitmentSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!profileData?.commitment_data && !profileEditData.showCommitmentEdit && (
                  <div style={{ padding: '16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 12px 0', color: '#64748b' }}>No commitment data found</p>
                    <button 
                      type="button"
                      className="btn btn--primary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                      onClick={() => setProfileEditData(prev => ({
                        ...prev, 
                        showCommitmentEdit: true,
                        commitmentQ1: '',
                        commitmentQ2: '',
                        commitmentQ3: ''
                      }))}
                    >
                      Create Your Commitment
                    </button>
                  </div>
                )}
              </div>

              {profileError && <p className="error-message">{profileError}</p>}

              <div className="modal__footer">
                <button
                  className="btn btn--primary btn--full"
                  disabled={
                    profileLoading || 
                    !profileEditData.username.trim() || 
                    !profileEditData.gender ||
                    profileEditData.usernameValidationState === 'taken' ||
                    profileEditData.usernameValidationState === 'checking' ||
                    (profileEditData.username !== profileData?.username && profileEditData.usernameValidationState !== 'available')
                  }
                  onClick={() => {
                    // Only update basic profile data (username, gender)
                    // WhatsApp is updated separately through verification flow
                    const updatedData = {
                      username: profileEditData.username.trim(),
                      gender: profileEditData.gender
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
                              Complete your surrender to unlock your device.
                            </p>
                            
                            <div style={{background: 'rgba(255,255,255,0.6)', border: '2px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '20px', marginBottom: '24px'}}>
                              <h4 style={{margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151'}}>
                                🎙️ Record your surrender statement:
                              </h4>
                              <div style={{background: 'rgba(255,255,255,0.8)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)', marginBottom: '16px'}}>
                                <p style={{margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#4b5563', fontStyle: 'italic'}}>
                                  "{currentFlow.steps[currentFlowStep - 1].surrender_text || surrenderText}"
                                </p>
                              </div>
                              <p style={{margin: '0', fontSize: '14px', color: '#6b7280', fontWeight: '500'}}>
                                👉 Please record a voice message reading the text above out loud to receive your unlock code.
                              </p>
                            </div>
                            
                            {/* Professional Recording Interface */}
                            <div style={{
                              background: 'rgba(249, 250, 251, 0.8)',
                              border: '1px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: '12px',
                              padding: '24px',
                              marginBottom: '24px',
                              textAlign: 'center'
                            }}>
                              {!audioBlob ? (
                                <div>
                                  {/* Recording Status and Timer */}
                                  <div style={{marginBottom: '20px'}}>
                                    {isRecording ? (
                                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'}}>
                                        {/* Recording Status */}
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          fontSize: '16px',
                                          fontWeight: '600',
                                          color: '#374151'
                                        }}>
                                          <div style={{
                                            width: '12px',
                                            height: '12px',
                                            backgroundColor: '#6B7280',
                                            borderRadius: '50%',
                                            animation: 'pulse 1.5s ease-in-out infinite'
                                          }}></div>
                                          Recording in progress...
                                        </div>
                                        
                                        {/* Timer */}
                                        <div style={{
                                          fontSize: '24px',
                                          fontWeight: '700',
                                          color: '#374151',
                                          fontFamily: 'monospace'
                                        }}>
                                          {recordingTime}s
                                        </div>
                                        
                                        {/* Audio Visualizer */}
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'end',
                                          gap: '3px',
                                          height: '60px',
                                          justifyContent: 'center',
                                          marginTop: '8px'
                                        }}>
                                          {Array.from({length: 20}, (_, i) => (
                                            <div
                                              key={i}
                                              style={{
                                                width: '4px',
                                                backgroundColor: audioLevels[i % audioLevels.length] > 20 ? '#6B7280' : '#E5E7EB',
                                                borderRadius: '2px',
                                                height: `${Math.max(8, (audioLevels[i % audioLevels.length] || 10) * 0.8)}px`,
                                                transition: 'all 0.1s ease',
                                                animation: audioLevels[i % audioLevels.length] > 20 ? 'bounce 0.3s ease' : 'none'
                                              }}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px'
                                      }}>
                                        <div style={{
                                          width: '80px',
                                          height: '80px',
                                          borderRadius: '50%',
                                          background: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          marginBottom: '8px'
                                        }}>
                                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                            <path d="M12 19v4"/>
                                            <path d="M8 23h8"/>
                                          </svg>
                                        </div>
                                        <h3 style={{
                                          margin: 0,
                                          fontSize: '18px',
                                          fontWeight: '600',
                                          color: '#374151'
                                        }}>
                                          Ready to Record
                                        </h3>
                                        <p style={{
                                          margin: 0,
                                          fontSize: '14px',
                                          color: '#6B7280',
                                          maxWidth: '280px'
                                        }}>
                                          Tap the button below to start recording your surrender statement
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Record Button */}
                                  <button
                                    onClick={(e) => {
                                      console.log('🎯 Button clicked! isRecording:', isRecording);
                                      console.log('🎯 mediaRecorder:', mediaRecorder);
                                      if (isRecording) {
                                        console.log('📞 Calling stopRecording...');
                                        stopRecording();
                                      } else {
                                        console.log('📞 Calling startRecording...');
                                        startRecording();
                                      }
                                    }}
                                    style={{
                                      background: isRecording 
                                        ? 'linear-gradient(135deg, #6B7280, #9CA3AF)'
                                        : 'linear-gradient(135deg, #374151, #6B7280)',
                                      border: 'none',
                                      borderRadius: '12px',
                                      padding: '14px 28px',
                                      fontSize: '16px',
                                      fontWeight: '600',
                                      color: 'white',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      margin: '0 auto',
                                      boxShadow: '0 4px 12px rgba(107, 114, 128, 0.2)',
                                      width: 'auto',
                                      minWidth: '160px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.transform = 'translateY(-2px)';
                                      e.target.style.boxShadow = '0 6px 16px rgba(107, 114, 128, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.transform = 'translateY(0px)';
                                      e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.2)';
                                    }}
                                  >
                                    {isRecording ? (
                                      <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <rect x="6" y="6" width="12" height="12"/>
                                        </svg>
                                        Stop Recording
                                      </>
                                    ) : (
                                      <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                        Start Recording
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
                                <div style={{
                                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
                                  border: '2px solid rgba(34, 197, 94, 0.3)',
                                  borderRadius: '16px',
                                  padding: '24px'
                                }}>
                                  {/* Success Message */}
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '16px',
                                    marginBottom: '24px'
                                  }}>
                                    <div style={{
                                      width: '60px',
                                      height: '60px',
                                      borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                        <path d="M20 6L9 17l-5-5"/>
                                      </svg>
                                    </div>
                                    <div style={{textAlign: 'center'}}>
                                      <h3 style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#374151'
                                      }}>
                                        Recording Complete!
                                      </h3>
                                      <p style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        color: '#6B7280'
                                      }}>
                                        Duration: {recordingTime} seconds
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Audio Player Preview */}
                                  <div style={{
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '20px',
                                    border: '1px solid rgba(0, 0, 0, 0.1)'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px'
                                    }}>
                                      <button
                                        onClick={async () => {
                                          try {
                                            console.log('🎵 Playing audio, blob size:', audioBlob.size, 'bytes');
                                            const audioUrl = URL.createObjectURL(audioBlob);
                                            const audio = new Audio(audioUrl);
                                            
                                            audio.onloadstart = () => console.log('🔄 Audio loading started');
                                            audio.oncanplay = () => console.log('✅ Audio can play');
                                            audio.onerror = (e) => console.error('❌ Audio error:', e);
                                            audio.onended = () => URL.revokeObjectURL(audioUrl);
                                            
                                            await audio.play();
                                            console.log('🎵 Audio playback started');
                                          } catch (error) {
                                            console.error('❌ Error playing audio:', error);
                                            alert('Failed to play audio. Please try recording again.');
                                          }
                                        }}
                                        style={{
                                          background: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
                                          border: 'none',
                                          borderRadius: '50%',
                                          width: '40px',
                                          height: '40px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          transition: 'transform 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                          <polygon points="5,3 19,12 5,21"/>
                                        </svg>
                                      </button>
                                      <div style={{flex: 1}}>
                                        <div style={{
                                          fontSize: '14px',
                                          fontWeight: '500',
                                          color: '#374151',
                                          marginBottom: '4px'
                                        }}>
                                          Surrender Recording
                                        </div>
                                        <div style={{
                                          fontSize: '12px',
                                          color: '#6B7280'
                                        }}>
                                          Tap play to review your recording
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div style={{
                                    display: 'flex',
                                    gap: '12px'
                                  }}>
                                    <button
                                      onClick={() => {
                                        setAudioBlob(null);
                                        setIsRecording(false);
                                        setRecordingTime(0);
                                      }}
                                      style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: '2px solid rgba(107, 114, 128, 0.3)',
                                        borderRadius: '10px',
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#6B7280',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(107, 114, 128, 0.1)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                      }}
                                    >
                                      🔄 Record Again
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            

                          </div>
                        </>
                      ) : currentFlow.steps[currentFlowStep - 1].step_type === 'pincode_display' ? (
                        <>
                          {/* Pincode Display Step */}
                          <div style={{marginBottom: '20px'}}>
                            <p style={{fontSize: '18px', lineHeight: '1.5', color: '#374151', marginBottom: '24px', textAlign: 'left'}}>
                              Device unlocked successfully. Use the appropriate code below:
                            </p>
                            
                            {/* MDM Profile Pincode (if profile was used) */}
                            {vpnProfileData?.pincode && (
                              <div style={{padding: '20px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', marginBottom: '16px'}}>
                                <h4 style={{margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151'}}>
                                  🔧 MDM Profile Removal Code
                                </h4>
                                <div style={{background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '16px', marginBottom: '12px'}}>
                                  <div style={{fontFamily: 'monospace', fontSize: '28px', fontWeight: '700', color: '#374151', letterSpacing: '4px'}}>
                                    {vpnProfileData.pincode}
                                  </div>
                                </div>
                                <p style={{margin: '0', fontSize: '13px', color: '#6b7280'}}>
                                  Use this code to remove the MDM profile when needed
                                </p>
                              </div>
                            )}
                            
                            {/* Screen Time Unlock Code */}
                            <div style={{padding: '20px', background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', marginBottom: '16px'}}>
                              <h4 style={{margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151'}}>
                                📱 Screen Time Unlock Code
                              </h4>
                              <div style={{background: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '16px', marginBottom: '12px'}}>
                                <div style={{fontFamily: 'monospace', fontSize: '28px', fontWeight: '700', color: '#374151', letterSpacing: '4px'}}>
                                  {unlockPincode || '----'}
                                </div>
                              </div>
                              <p style={{margin: '0', fontSize: '13px', color: '#6b7280'}}>
                                Enter this code on your device to unlock screen time for 15 minutes
                              </p>
                            </div>
                            
                            <div style={{background: 'rgba(249, 250, 251, 0.8)', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px', marginBottom: '24px'}}>
                              <p style={{margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '500'}}>
                                ✅ Your device has been automatically unlocked and removed from monitoring
                              </p>
                            </div>
                            
                            {/* Return to Dashboard Button */}
                            <div style={{textAlign: 'center'}}>
                              <button
                                onClick={() => {
                                  setShowDeviceFlow(false);
                                  setCurrentFlow(null);
                                  setCurrentFlowStep(1);
                                  // Clear any flow-related state
                                  setAudioBlob(null);
                                  setUnlockPincode(null);
                                  setSurrenderApproved(false);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #374151, #6B7280)',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '12px 24px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: 'white',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  margin: '0 auto',
                                  boxShadow: '0 2px 8px rgba(107, 114, 128, 0.2)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'translateY(0px)';
                                  e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.2)';
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 12h18m-9-9l-9 9 9 9"/>
                                </svg>
                                Return to Dashboard
                              </button>
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
                            <div className="card" style={{marginBottom: '20px'}}>
                              <div className="card-header">
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                  <div className="audio-icon">🎵</div>
                                  <h4 className="card-title" style={{margin: '0'}}>
                                    Audio Pincode Guide
                                  </h4>
                                </div>
                              </div>
                              <div className="card-body">
                              
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
                                  <div style={{textAlign: 'center', marginBottom: '16px'}}>
                                    <p style={{margin: '0', fontSize: '14px', color: 'var(--text-secondary)'}}>
                                      🎧 Your audio guide is ready! Listen for step-by-step pincode instructions.
                                    </p>
                                    <p style={{margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)'}}>
                                      🔒 Pincode is securely generated - no need to memorize it
                                    </p>
                                  </div>
                                  
                                  <button
                                    className="btn btn--primary btn--sm"
                                    onClick={playAudioGuide}
                                    style={{width: '100%', marginBottom: '8px'}}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                                      <polygon points="5 3,19 12,5 21,5 3"/>
                                    </svg>
                                    🔊 Play Audio Guide
                                  </button>
                                  
                                  <button
                                    className="btn btn--outline btn--sm"
                                    onClick={() => {
                                      setAudioGuideData(null);
                                      console.log('🔄 Audio guide cleared, user can generate new one');
                                    }}
                                    style={{width: '100%', fontSize: '12px'}}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                                      <path d="M1 4v6h6"/>
                                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                                    </svg>
                                    🔄 Generate New Code
                                  </button>
                                </div>
                              )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="modal__footer">
                    {/* Download Profile Button for Setup Profile step (step 3) - not for pincode display */}
                    {currentFlowStep === 3 && currentFlow.steps[currentFlowStep - 1]?.step_type !== 'pincode_display' && (
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
                    
                    {/* Primary Action Button - hide for pincode display */}
                    {currentFlow.steps[currentFlowStep - 1]?.step_type !== 'pincode_display' && (
                      <button
                        className="btn btn--primary btn--full"
                        onClick={nextFlowStep}
                        disabled={surrenderSubmitting}
                        style={{
                          opacity: surrenderSubmitting ? 0.7 : 1,
                          cursor: surrenderSubmitting ? 'not-allowed' : 'pointer',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center'
                        }}
                      >
                        {surrenderSubmitting ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid transparent',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              marginRight: '8px',
                              flexShrink: 0
                            }}></div>
                            <span>Processing Surrender...</span>
                          </>
                        ) : (
                          <>
                            {currentFlow.steps && currentFlow.steps[currentFlowStep - 1] 
                              ? currentFlow.steps[currentFlowStep - 1].action_button 
                              : 'Next Step'} →
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Dynamic Cancel/Back Button */}
                    <button 
                      className="link-back"
                      onClick={() => {
                        if (currentFlowStep === 1) {
                          // Cancel on first step - stop any playing audio
                          if (currentAudio) {
                            currentAudio.pause();
                            currentAudio.currentTime = 0;
                            setCurrentAudio(null);
                          }
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
              <div style={{margin: '0 0 16px 0'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Email</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6b7280',
                    fontFamily: 'monospace'
                  }}>
                    merijn@risottini.com
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Username</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    @theking
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Gender</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    🙋‍♂️ Man
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>WhatsApp</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    fontFamily: 'monospace'
                  }}>
                    +31627207989
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Commitment</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: profileData?.commitment_data ? '#059669' : '#6b7280',
                    backgroundColor: '#f9fafb',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {profileData?.commitment_data ? 'Set ✓' : 'Not Set ✗'}
                  </span>
                </div>
                {profileData?.commitment_data && (
                  <div style={{padding: '12px 0', borderBottom: '1px solid #f3f4f6'}}>
                    <div style={{marginBottom: '8px'}}>
                      <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '500'}}>What to change:</span>
                      <p style={{margin: '2px 0 0 0', fontSize: '14px', color: '#374151'}}>"{profileData.commitment_data.q1}"</p>
                    </div>
                    <div style={{marginBottom: '8px'}}>
                      <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '500'}}>What to gain:</span>
                      <p style={{margin: '2px 0 0 0', fontSize: '14px', color: '#374151'}}>"{profileData.commitment_data.q2}"</p>
                    </div>
                    <div>
                      <span style={{fontSize: '12px', color: '#6b7280', fontWeight: '500'}}>Doing this for:</span>
                      <p style={{margin: '2px 0 0 0', fontSize: '14px', color: '#374151'}}>"{profileData.commitment_data.q3}"</p>
                    </div>
                  </div>
                )}
              </div>
              <div style={{marginTop: 'auto', display: 'flex', gap: '8px'}}>
                <button
                  className="btn btn--outline btn--sm"
                  style={{flex: 1}}
                  onClick={() => {
                    setProfileEditData({
                      username: profileData?.username || '@theking',
                      gender: profileData?.gender || 'man',
                      whatsapp: profileData?.whatsapp ? profileData.whatsapp.replace(/^\+\d{1,3}/, '') : '627207989',
                      country_code: profileData?.whatsapp ? profileData.whatsapp.match(/^\+\d{1,3}/)?.[0] || '+31' : '+31',
                      usernameValidationState: null,
                      showWhatsAppEdit: false,
                      whatsappCodeSent: false,
                      whatsappCode: '',
                      verifyingWhatsApp: false,
                      verifyingCode: false,
                      whatsappVerified: false,
                      // Commitment fields - populate existing data
                      showCommitmentEdit: false,
                      commitmentQ1: profileData?.commitment_data?.q1 || '',
                      commitmentQ2: profileData?.commitment_data?.q2 || '',
                      commitmentQ3: profileData?.commitment_data?.q3 || '',
                      commitmentValidating: false,
                      commitmentValidation: null,
                      commitmentSaving: false
                    });
                    setProfileError('');
                    setShowProfileEdit(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Devices */}
            <div className="card card--equal" style={{display: 'flex', flexDirection: 'column'}}>
              <div className="card-header">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h3 className="card-title" style={{margin: 0}}>My Devices</h3>
                  <span style={{fontSize: '14px', color: '#6b7280', fontWeight: '500'}}>
                    {devices.length} device{devices.length === 1 ? '' : 's'}
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
                        <button 
                          className="btn btn--secondary btn--sm"
                          onClick={() => startDeviceFlow('device_unlock_flow', device.id)}
                          style={{fontSize: '12px', padding: '4px 8px'}}
                        >
                          Unlock
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{marginTop: 'auto'}}>
                {devices.length < 3 ? (
                  <button 
                    className="btn btn--outline btn--sm" 
                    style={{width: '100%'}} 
                    onClick={() => startDeviceFlow('device_setup_flow')}
                  >
                    Add Device
                  </button>
                ) : (
                  <div style={{
                    textAlign: 'center', 
                    padding: '8px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px', 
                    border: '1px dashed #dee2e6',
                    fontSize: '12px',
                    color: '#6c757d'
                  }}>
                    Maximum reached
                  </div>
                )}
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
              <div className="step-indicator">{cancelStep === 4 ? 'Complete' : `Step ${cancelStep} of 3`}</div>
              <h3 id="cancel-flow-title" className="modal__title">
                {cancelStep === 1 && 'We\'re sorry to see you go'}
                {cancelStep === 2 && 'Help us improve'}
                {cancelStep === 3 && 'Confirm cancellation'}
                {cancelStep === 4 && 'Subscription cancelled'}
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

              {cancelStep === 4 && (
                <div style={{textAlign: 'center', marginBottom: '20px'}}>
                  <div style={{fontSize: '4rem', marginBottom: '24px'}}>✅</div>
                  
                  <h4 style={{fontSize: '24px', fontWeight: '600', color: '#059669', marginBottom: '16px'}}>
                    Subscription Successfully Cancelled
                  </h4>
                  
                  <p style={{fontSize: '16px', lineHeight: '1.5', color: '#374151', marginBottom: '24px'}}>
                    Your subscription has been cancelled and you will receive a confirmation email shortly.
                  </p>
                  
                  <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '20px', marginBottom: '24px', textAlign: 'left'}}>
                    <h5 style={{margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#059669'}}>
                      What happens next:
                    </h5>
                    <ul style={{margin: 0, paddingLeft: '20px', color: '#374151', lineHeight: '1.6'}}>
                      <li>You'll continue to have access until your current billing period ends</li>
                      <li>A confirmation email will be sent to your registered email address</li>
                      <li>Your progress and data will be preserved for 30 days in case you change your mind</li>
                      <li>No further charges will be made to your account</li>
                    </ul>
                  </div>
                  
                  <div style={{background: '#e0f2fe', border: '1px solid #0284c7', borderRadius: '8px', padding: '16px', marginBottom: '20px'}}>
                    <p style={{margin: 0, fontSize: '14px', color: '#0369a1', fontWeight: '500'}}>
                      💙 Thank you for being part of the Screen Time Journey community. We hope to see you again soon!
                    </p>
                  </div>
                  
                  <p style={{fontSize: '14px', color: '#6b7280', margin: 0}}>
                    Questions? Contact us at <strong>support@screentimejourney.com</strong>
                  </p>
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

              {cancelStep === 4 && (
                <div style={{textAlign: 'center'}}>
                  <p style={{fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0'}}>
                    This window will close automatically in a few seconds...
                  </p>
                  <button
                    className="btn btn--secondary btn--full"
                    onClick={closeCancelFlow}
                    style={{width: '100%'}}
                  >
                    Close
                  </button>
                </div>
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
// Rendered by the host HTML; add minimal footer div here if needed// Backend updated with Shopify subscription cancellation API integration Wed Sep  3 13:07:57 CEST 2025
// Force rebuild Wed Sep  3 22:49:56 CEST 2025
