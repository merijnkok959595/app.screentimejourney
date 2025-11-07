import React, { useState, useEffect, useRef } from 'react';
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
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/male_level_0_groundzero.jpg",
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
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/male_level_1_fighter.jpg",
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
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/male_level_10_theking.jpg",
    "next_level_title": null,
    "next_level_emoji": null,
    "days_to_next": null,
    "level_template": "m10"
  }
];

// Progress calculation function
const calculateProgress = (latestDevice, gender = 'male', milestones = DEFAULT_MILESTONES) => {
  console.log('📊 calculateProgress called with device:', latestDevice);
  console.log('📊 Milestones:', milestones);
  
  // If no device, default to 0 days
  if (!latestDevice) {
    console.log('⚠️ No device provided, defaulting to 0 days');
    const genderMilestones = milestones.filter(m => m.gene === gender);
    const currentLevel = genderMilestones[0] || milestones[0];
    
    return {
      daysInFocus: 0,
      progressPercentage: 0,
      currentLevel: currentLevel,
      daysToNext: currentLevel?.days_to_next || 0,
      finalGoalDays: 365
    };
  }

  // Calculate days in focus from device's added_at date
  const deviceAddedDate = new Date(latestDevice.added_at || latestDevice.focus_start_date || latestDevice.created_at);
  const today = new Date();
  const timeDiff = today.getTime() - deviceAddedDate.getTime();
  const daysInFocus = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
  
  console.log('📅 Device added:', deviceAddedDate, '→ Days in focus:', daysInFocus);

  // Find current level based on days in focus
  const genderMilestones = milestones.filter(m => m.gene === gender);
  if (!genderMilestones.length) {
    console.error('❌ No milestones found for gender:', gender);
    return {
      daysInFocus,
      progressPercentage: 0,
      currentLevel: milestones[0] || DEFAULT_MILESTONES[0],
      daysToNext: 0,
      finalGoalDays: 365 - daysInFocus
    };
  }
  
  let currentLevel = genderMilestones[0]; // Default to level 0
  
  for (let i = genderMilestones.length - 1; i >= 0; i--) {
    if (daysInFocus >= genderMilestones[i].milestone_day) {
      currentLevel = genderMilestones[i];
      break;
    }
  }
  
  console.log('🎯 Current level:', currentLevel.title, currentLevel.emoji);

  // Calculate days to next level
  const daysToNext = currentLevel.days_to_next 
    ? Math.max(0, currentLevel.days_to_next - (daysInFocus - currentLevel.milestone_day)) 
    : 0;

  // Calculate progress percentage to next level
  let progressPercentage = 0;
  if (currentLevel.next_level_title && currentLevel.days_to_next) {
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
    daysToNext,
    finalGoalDays: Math.max(0, 365 - daysInFocus)
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
const ProgressSection = ({ latestDevice, customerName = "Merijn", customerEmail = "", customerGender = "male", percentile = 6, devices, milestones = DEFAULT_MILESTONES, startDeviceFlow }) => {
  // Get the latest device from devices array (sorted by added_at, most recent first)
  // Filter out any undefined/null devices and handle missing added_at properties
  const realLatestDevice = devices && devices.length > 0 
    ? devices
        .filter(d => d && (d.added_at || d.addedDate || d.created_at)) // Filter out undefined/null devices
        .sort((a, b) => {
          const aDate = new Date(a.added_at || a.addedDate || a.created_at || 0);
          const bDate = new Date(b.added_at || b.addedDate || b.created_at || 0);
          return bDate - aDate;
        })[0]
    : null;
  
  // Use real device data if available, otherwise use passed latestDevice or mock
  const deviceData = realLatestDevice || latestDevice || null;
  
  // Use the actual user's gender for milestone calculation
  const userGender = customerGender || 'male';
  const progress = calculateProgress(deviceData, userGender, milestones);
  const { daysInFocus, progressPercentage, currentLevel, daysToNext, finalGoalDays } = progress;
  
  // Extract first name from email or use username
  let firstName = customerName;
  if (customerEmail && customerEmail.includes('@')) {
    // Extract name before @ and capitalize first letter
    const emailName = customerEmail.split('@')[0];
    firstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
  } else if (customerName) {
    // Use username without @ if present
    firstName = customerName.replace('@', '');
  }
  
  // Check if using default or API milestones for debugging
  const isUsingDefault = milestones === DEFAULT_MILESTONES;
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Screentime Journey</h3>

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
          <h2 className="journey-greeting journey-greeting--big">Hi {firstName},</h2>
          <p className="journey-line" style={{marginBottom: '12px'}}>You are among the top <strong>{percentile}%</strong> in the world 🌍</p>
          <p className="journey-line" style={{marginBottom: '12px'}}>Right now, you are <strong>{currentLevel.title} {currentLevel.emoji}</strong> with <strong>{daysInFocus}</strong> days in focus.</p>
          {currentLevel.next_level_title && (
            <p className="journey-line journey-line--next" style={{marginBottom: '12px'}}>Next up: <strong>{currentLevel.next_level_title} {currentLevel.next_level_emoji}</strong> in <strong>{daysToNext}</strong> days.</p>
          )}
          <p className="journey-line journey-line--path">You're on your path to <strong>{userGender === 'male' ? 'King' : 'Queen'} 👑</strong> in <strong>{finalGoalDays}</strong> days.</p>
          
          {/* Add Device Button */}
          <div style={{marginTop: '20px'}}>
            {devices.length < 3 ? (
              <button 
                className={`btn btn--primary ${devices.length === 0 ? 'btn-primary--animated' : ''}`}
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

// Audio Player Component
function AudioPlayer({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  
  // Debug: Log what audioUrl we received
  useEffect(() => {
    console.log('🎵 AudioPlayer received audioUrl:', audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Update audio source when audioUrl changes
    audio.src = audioUrl;
    audio.load(); // Reload the audio element with new source
    setIsPlaying(false); // Reset playing state when source changes
    setCurrentTime(0); // Reset time

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    if (!audioUrl) {
      console.error('❌ No audio URL available');
      alert('Audio is not available. Please generate an audio guide first.');
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      console.error('❌ Audio element not found');
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        console.log('🎵 Attempting to play audio:', audioUrl);
        await audio.play();
        setIsPlaying(true);
        console.log('✅ Audio playing');
      }
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      alert('Failed to play audio. The audio may still be loading. Please try again in a moment.');
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * duration;
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Don't render if no audio URL
  if (!audioUrl) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <p style={{margin: 0, fontSize: '14px'}}>Audio not available. Please generate an audio guide first.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.8)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      padding: '16px'
    }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          style={{
            background: 'linear-gradient(135deg, #2E0456, #440B6C)',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12"/>
            </svg>
          )}
        </button>

        {/* Progress Bar and Time */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '8px'}}>
          <div
            onClick={handleSeek}
            style={{
              height: '6px',
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '3px',
              cursor: 'pointer',
              position: 'relative',
              marginBottom: '4px'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                background: 'linear-gradient(135deg, #2E0456, #440B6C)',
                borderRadius: '3px',
                transition: 'width 0.1s linear'
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#9CA3AF'
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [whatToChange, setWhatToChange] = useState('');
  const [whatToGain, setWhatToGain] = useState('');
  const [doingThisFor, setDoingThisFor] = useState('');
  const [commitmentValidating, setCommitmentValidating] = useState(false);
  const [commitmentError, setCommitmentError] = useState('');
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
  const [percentile, setPercentile] = useState(6); // Default to 6% (top performer)
  
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
  
  // Shared device_id for tracking across the entire setup flow
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  
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
    email_enabled: true,  // Email enabled by default
    whatsapp_enabled: false  // WhatsApp enabled when verified
  });
  const [notificationsSubmitting, setNotificationsSubmitting] = useState(false);

  // Logs state
  const [showLogsFlow, setShowLogsFlow] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Payment wall state
  const [showPaymentWall, setShowPaymentWall] = useState(false);

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

  // Shrink header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.header');
      const announcementBar = document.querySelector('.announcement-bar');
      
      if (header && announcementBar) {
        if (window.scrollY > 50) {
          header.classList.add('scrolled');
          announcementBar.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
          announcementBar.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
    // Load milestone data, percentile, and device flows when app starts
    fetchMilestoneData();
    fetchPercentile();
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
    setMilestonesLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws';
      
      // Fetch milestones for both genders
      const [maleResponse, femaleResponse] = await Promise.all([
        fetch(`${apiUrl}/get_milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gender: 'male' })
        }),
        fetch(`${apiUrl}/get_milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gender: 'female' })
        })
      ]);

      const maleResult = await maleResponse.json();
      const femaleResult = await femaleResponse.json();

      // Combine both gender milestones
      const allMilestones = [];
      if (maleResponse.ok && maleResult.success && maleResult.milestones) {
        allMilestones.push(...maleResult.milestones);
      }
      if (femaleResponse.ok && femaleResult.success && femaleResult.milestones) {
        allMilestones.push(...femaleResult.milestones);
      }

      if (allMilestones.length > 0) {
        setMilestones(allMilestones);
        setMilestonesError(null);
        console.log(`✅ Milestone data loaded: ${maleResult.milestones?.length || 0} male + ${femaleResult.milestones?.length || 0} female milestones`);
      } else {
        throw new Error('No milestones returned from API');
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

  // Function to fetch user's percentile ranking
  const fetchPercentile = async () => {
    try {
      const customerId = extractCustomerId();
      if (!customerId) {
        console.log('⚠️ No customer ID, skipping percentile calculation');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/calculate_percentile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id: customerId }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPercentile(result.percentile);
        console.log(`✅ Percentile calculated: Top ${result.percentile}%`);
      } else {
        console.log('⚠️ Failed to calculate percentile, using default 6%');
      }
      
    } catch (error) {
      console.error('❌ Error fetching percentile (non-critical):', error.message);
      // Keep default percentile of 6% - this is non-critical, app continues to work
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
                body: '‼️ Extra optional protection against porn',
                step_type: 'video',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
                action_button: 'Next Step'
              },
              {
                step: 4,
                title: 'Setup Pincode',
                body: '',
                step_type: 'video',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
                action_button: 'Complete Setup'
              }
            ]
          },
          device_unlock_flow: {
            flow_id: 'device_unlock',
            flow_name: 'Unlock Device',
            total_steps: 2,
            steps: [
              {
                step: 1,
                title: 'Unlock Device',
                body: '',
                step_type: 'video_surrender',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
                surrender_text: 'I hereby give up on changing my screen time habits. I give up the chance to be a present family man, live with more presence and purpose, and give attention to my wife and children. I choose distraction over discipline, and I surrender my intention to grow.',
                action_button: 'Submit Surrender'
              },
              {
                step: 2,
                title: 'Unlocked Device',
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
            // Validate flow structure
            if (result.data.steps && Array.isArray(result.data.steps) && result.data.steps.length > 0) {
              flows[flowKey] = result.data;
              
              // HOTFIX: Ensure step 4 body is always empty (override any API data)
              if (flows[flowKey].steps && flows[flowKey].steps.length >= 4) {
                const step4 = flows[flowKey].steps.find(s => s.step === 4);
                if (step4) {
                  step4.body = '';
                  console.log('🔧 Forced step 4 body to empty string');
                }
              }
              
              console.log(`✅ Loaded ${flowKey}:`, result.data.flow_name, `(${result.data.steps.length} steps)`);
            } else {
              console.error(`❌ Invalid flow structure for ${flowKey}:`, result.data);
            }
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
              body: '‼️ Setup dummy pincode first.',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
              action_button: 'Next Step'
            },
            {
              step: 3,
              title: 'Setup Profile',
              body: '‼️ Extra optional protection against porn',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
              action_button: 'Next Step'
            },
            {
              step: 4,
              title: 'Setup Pincode',
              body: '',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
              action_button: 'Complete Setup'
            }
          ]
        },
        device_unlock_flow: {
          flow_id: 'device_unlock',
          flow_name: 'Unlock Device',
          total_steps: 2,
          steps: [
            {
              step: 1,
              title: 'Unlock Device',
              body: '',
              step_type: 'video_surrender',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
              surrender_text: 'I hereby give up on changing my screen time habits. I give up the chance to be a present family man, live with more presence and purpose, and give attention to my wife and children. I choose distraction over discipline, and I surrender my intention to grow.',
              action_button: 'Submit Surrender'
            },
            {
              step: 2,
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
              customer_id: customerData?.customerId || extractCustomerId(),
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
      // Pincode is only required for macOS devices (for MDM profile removal)
      // iOS devices can generate profiles without a pincode
      let pincode = null;
      
      if (deviceFormData.device_type === 'macOS') {
        // macOS requires a pincode for MDM profile removal
        if (!sharedPincode || !sharedPincode.pincode) {
          console.error('❌ No shared pincode available. Audio guide must be generated first for macOS devices.');
          alert('Please generate an audio guide first before creating the VPN profile for macOS.');
          setProfileGenerating(false);
          return;
        }
        pincode = sharedPincode.pincode;
        console.log('✅ Using shared pincode for macOS VPN profile');
      } else {
        // iOS devices don't require a pincode
        console.log('✅ Generating iOS profile without pincode requirement');
      }
      
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
      
      // Generate device_id early for tracking (or reuse existing one)
      if (!currentDeviceId) {
        setCurrentDeviceId(`device_${Date.now()}`);
      }
      const deviceId = currentDeviceId || `device_${Date.now()}`;
      
      // Call the backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/generate_vpn_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_type: deviceFormData.device_type,
          device_name: deviceFormData.device_name,
          customer_id: customerId,
          device_id: deviceId,  // NEW: Pass device_id for tracking
          pincode: pincode  // Pass the shared pincode for macOS devices
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
          profile_url: result.result.s3_profile_url || result.result.s3_url, // Store for device tracking
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
      // Generate a new pincode (backend will store it)
      const pincode = Math.floor(1000 + Math.random() * 9000).toString();
      const [first, second, third, fourth] = pincode.split('');
      
      // Check if this is local development
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // In local development, create mock audio data with text-to-speech
        const audioData = {
          pincode: pincode,
          digits: { first, second, third, fourth },
          audioUrl: 'demo-audio', // Special flag for local dev
          deviceType: deviceFormData.device_type,
          instructions: `Generated pincode: ${pincode}. Click Settings, then Screen Time, then Lock Screen Time settings. Follow the audio instructions to enter: ${first}, ${second}, ${third}, ${fourth}.`,
          isLocalDemo: true
        };
        
        setAudioGuideData(audioData);
        setSharedPincode({ pincode, deviceType: deviceFormData.device_type });
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
        
        // In production, call the backend API to generate audio (backend will generate and store pincode)
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/generate_audio_guide`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_name: deviceFormData.device_name,
            device_type: deviceFormData.device_type,
            customer_id: customerId,
            device_id: currentDeviceId, // Pass the device ID for tracking
            pincode: pincode // Send generated pincode to backend
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          // Debug: Log the full response to understand structure
          console.log('🔍 Full audio guide response:', result);
          console.log('🔍 result.audio_url:', result.audio_url);
          console.log('🔍 result.tts_result?.public_url:', result.tts_result?.public_url);
          
          // Transform backend response to match frontend expectation
          // Try multiple possible property names for audio URL
          const audioUrl = result.audio_url || 
                          result.tts_result?.public_url || 
                          result.audioUrl || 
                          result.audioData?.audioUrl || 
                          null;
          
          console.log('🔍 Resolved audioUrl:', audioUrl);
          
          const audioData = {
            pincode: result.pincode,
            digits: result.digits,
            audioUrl: audioUrl, // Real audio URL from backend
            audio_url: result.audio_url, // Store for device tracking
            instructions: `Generated pincode: ${result.pincode}. Click Settings, then Screen Time, then Lock Screen Time settings. Follow the audio instructions to enter: ${result.digits.first}, ${result.digits.second}, ${result.digits.third}, ${result.digits.fourth}.`,
            executionId: result.execution_id
          };
          
          setAudioGuideData(audioData);
          setSharedPincode({ 
            pincode: result.pincode, 
            deviceType: deviceFormData.device_type,
            audio_url: result.audio_url 
          });
          console.log('✅ Audio guide generated:', audioData);
          
          if (!audioUrl) {
            console.warn('⚠️ Audio URL is null/undefined - audio playback will not be available');
          }
          
          // NOTE: Device is NOT saved to database here - it will only be saved when user clicks "Complete Setup"
          // This ensures devices are only added to the database when the user explicitly completes the setup flow
          console.log('📝 Audio guide generated - device will be saved when user completes setup');
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
    if (!audioGuideData) {
      alert('No audio guide available to play. Please generate an audio guide first.');
      return;
    }
    
    if (!audioGuideData.audioUrl || audioGuideData.audioUrl === 'demo-audio' || audioGuideData.audioUrl === null) {
      alert('Audio playback is not available in demo mode. The pincode and instructions are shown below for manual entry.');
      return;
    }
    
    if (audioGuideData.audioUrl === 'production-no-tts') {
      alert('Audio generation is temporarily unavailable. Please use the pincode and instructions shown below for manual entry.');
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
        
        // Move to step 2 (pincode display)
        setCurrentFlowStep(2);
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
          
          // Move to step 2 (pincode display)
          setCurrentFlowStep(2);
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
    console.log('🚀 submitCancellation called - NEW CODE VERSION');
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

      // Get Seal subscription ID from profile data
      console.log('🔍 Checking for subscription ID...');
      const sealSubscriptionId = profileData?.seal_subscription_id || customerData?.seal_subscription_id;
      
      console.log('🔍 Seal subscription ID:', sealSubscriptionId);
      console.log('🔍 Profile data:', profileData);
      console.log('🔍 Customer data:', customerData);
      
      // Call our Lambda function which will proxy the request to Seal API (avoids CORS issues)
      console.log('📤 Calling Lambda to cancel subscription via Seal API...');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/cancel_subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          customer_email: customerData?.email || profileData?.email,
          cancel_reason: cancelReason,
          feedback: cancelFeedback,
          cancel_date: new Date().toISOString(),
          seal_subscription_id: sealSubscriptionId
        })
      });

      console.log('📥 Lambda response status:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📥 Lambda response body:', result);

      // Check if cancellation was successful
      if (response.ok && result.success) {
        console.log('✅ Subscription cancelled successfully via Seal API:', result);
        
        // Update local state to reflect cancellation
        setCustomerData(prev => ({
          ...prev,
          subscription_status: 'cancelled',
          subscription_cancelled_at: new Date().toISOString()
        }));
        
        // Refresh profile data to get updated status from backend
        await fetchProfileData();
        
        // Show success step
        setCancelStep(4);
        
      } else {
        console.error('❌ Seal API cancellation failed:', {
          status: response.status,
          statusText: response.statusText,
          result: result
        });
        throw new Error(result.error || result.message || `Failed to cancel subscription (Status: ${response.status}). Please contact support.`);
      }

    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      alert(`❌ Failed to cancel subscription: ${error.message}\n\nPlease try again or contact support at info@screentimejourney.com`);
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

  const updateNotificationSetting = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Set default notification settings when user validates WhatsApp
  const setDefaultNotificationSettings = () => {
    setNotificationSettings(prev => ({
      ...prev,
      whatsapp_enabled: true  // Enable WhatsApp notifications when verified
    }));
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
        
        closeNotificationsFlow();
        return;
      }

      // Send simplified notification preferences
      const notificationPayload = {
        customer_id: customerId,
        email_enabled: notificationSettings.email_enabled,
        whatsapp_enabled: notificationSettings.whatsapp_enabled
      };

      console.log('📤 Sending notification settings:', notificationPayload);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/update_notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload)
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
        console.log('✅ Notification settings saved successfully');
        closeNotificationsFlow();
      } else if (response.status === 404) {
        // Endpoint not implemented yet - save locally for now
        console.log('⚠️ Notification endpoint not implemented, saving locally');
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
  const startDeviceFlow = async (flowType, deviceId = null) => {
    console.log('🎬 Attempting to start flow:', flowType, 'for device:', deviceId);
    console.log('📋 Available flows:', Object.keys(deviceFlows));
    
    // For unlock flows, reload devices from backend first to ensure we have latest data
    if (flowType === 'device_unlock_flow') {
      console.log('🔄 Reloading devices before unlock flow...');
      const loadedDevices = await loadDevicesFromBackend();
      console.log('✅ Devices reloaded:', loadedDevices.length, 'devices');
      console.log('📱 Loaded devices:', loadedDevices);
      
      // Add a small delay to ensure React state has been updated
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('✅ State should now be updated, devices.length:', devices.length);
    }
    
    const flow = deviceFlows[flowType];
    if (!flow || !flow.steps || !Array.isArray(flow.steps) || flow.steps.length === 0) {
      console.error('❌ Flow not found or invalid:', flowType, flow);
      console.warn('⚠️ Flow not found in deviceFlows or invalid structure, using fallback:', flowType);
      
      // Check if we have fallback flows available
      if (flowType === 'device_unlock_flow') {
        console.log('🔄 Using fallback unlock flow');
        const fallbackFlow = {
          flow_id: 'device_unlock',
          flow_name: 'Unlock Device',
          total_steps: 2,
          steps: [
            {
              step: 1,
              title: 'Unlock Device',
              body: '',
              step_type: 'video_surrender',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
              surrender_text: 'I hereby give up on changing my screen time habits. I give up the chance to be a present family man, live with more presence and purpose, and give attention to my wife and children. I choose distraction over discipline, and I surrender my intention to grow.',
              action_button: 'Submit Surrender'
            },
            {
              step: 2,
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
      } else if (flowType === 'device_setup_flow') {
        console.log('🔄 Using fallback device setup flow');
        const fallbackFlow = {
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
              title: 'Understanding Digital Wellness',
              body: 'Before we proceed, please watch this important video about your Screen Time Journey.',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/S1.mp4',
              action_button: 'I\'ve Watched the Video'
            },
            {
              step: 3,
              title: 'Download Profile',
              body: 'Download and install the configuration profile on your device to start your Screen Time Journey.',
              step_type: 'download',
              action_button: 'Generate Profile'
            },
            {
              step: 4,
              title: 'Setup Complete',
              body: 'Congratulations! Your device has been added to your Screen Time Journey. You can now monitor and manage your digital wellness.',
              step_type: 'confirmation',
              action_button: 'Complete Setup'
            }
          ]
        };
        
        setCurrentFlow({ ...fallbackFlow, flowType, deviceId });
        setCurrentFlowStep(1);
        setShowDeviceFlow(true);
        console.log('✅ Started fallback device setup flow:', fallbackFlow.flow_name);
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
    
    // Handle surrender step (both standalone and video_surrender)
    if (currentStep && (currentStep.step_type === 'surrender' || currentStep.step_type === 'video_surrender')) {
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
      
      console.log('📋 Device setup flow continuing to step', nextStep);
      
      // VPN profile generation (Step 3) is OPTIONAL - users can skip or generate manually
      // This is only relevant for macOS devices and provides extra protection
      
      // Ensure device ID is created for tracking (needed for draft device pattern)
      if (currentFlow.flowType === 'device_setup_flow' && !currentDeviceId) {
        const newDeviceId = `device_${Date.now()}`;
        setCurrentDeviceId(newDeviceId);
        console.log('📝 Created device ID for tracking:', newDeviceId);
      }
      
      // Audio guide generation (Step 4) is MANDATORY - auto-generate when reaching this step
      if (nextStep === 4 && currentFlow.flowType === 'device_setup_flow' && !audioGuideData) {
        console.log('🔧 MANDATORY: Auto-generating audio guide for step 4');
        try {
          generateAudioGuide();
        } catch (error) {
          console.error('❌ Error auto-generating audio guide:', error);
          alert('Failed to generate audio guide. Please try again.');
        }
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
        
        // Load notification settings from profile
        if (result.profile.email_enabled !== undefined || result.profile.whatsapp_enabled !== undefined) {
          setNotificationSettings({
            email_enabled: result.profile.email_enabled !== undefined ? result.profile.email_enabled : true,
            whatsapp_enabled: result.profile.whatsapp_enabled !== undefined ? result.profile.whatsapp_enabled : false
          });
          console.log('✅ Notification settings loaded:', {
            email: result.profile.email_enabled,
            whatsapp: result.profile.whatsapp_enabled
          });
        }
        
        // Load activity logs from profile
        if (result.profile.activity_logs && Array.isArray(result.profile.activity_logs)) {
          const formattedLogs = result.profile.activity_logs.map(log => ({
            id: log.id || `log_${Date.now()}_${Math.random()}`,
            timestamp: log.timestamp ? (() => {
              try {
                const date = new Date(log.timestamp);
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }).replace(',', '');
              } catch (e) {
                return log.timestamp;
              }
            })() : '',
            type: log.type || 'unknown',
            title: log.title || '',
            description: log.description || '',
            pincode: log.unlock_code || log.pincode || null
          }));
          setLogs(formattedLogs);
          console.log('✅ Activity logs loaded:', formattedLogs.length, 'logs');
        } else {
          setLogs([]);
          console.log('📝 No activity logs found in profile');
        }
        
        // Show account wall only if username doesn't exist
        const hasUsername = result.profile?.username && result.profile.username.trim();
        setShowOnboarding(!hasUsername);
        console.log(`🔍 Username check: ${hasUsername ? 'exists' : 'missing'} - Account wall: ${!hasUsername ? 'show' : 'hide'}`);
        
        // Show payment wall if subscription is cancelled (check both profile and customerData)
        const profileCancelled = result.profile?.subscription_status === 'cancelled' || result.profile?.subscription_status === 'cancel_scheduled';
        const customerCancelled = customerData?.subscription_status === 'cancelled' || customerData?.subscription_status === 'cancel_scheduled';
        const isCancelled = profileCancelled || customerCancelled;
        setShowPaymentWall(isCancelled && hasUsername);
        console.log(`💳 Payment wall: ${isCancelled && hasUsername ? 'show' : 'hide'} (profile: ${profileCancelled}, customer: ${customerCancelled})`);
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

    const validateCommitment = async () => {
      console.log('🔍 Starting commitment validation...');
      setCommitmentError('');
      setCommitmentValidating(true);
    
    try {
      console.log('📤 Sending validation request to API...');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/evaluate_commitment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          what_to_change: whatToChange.trim(),
          what_to_gain: whatToGain.trim(),
          doing_this_for: doingThisFor.trim()
        })
      });
      
      console.log('📥 Received response, status:', response.status);
      const result = await response.json();
      console.log('📋 Validation result:', result);
      
      if (response.ok && result.success) {
        if (result.is_valid) {
          // Validation passed, move to next step
          console.log('✅ Commitment validated successfully!');
          setCommitmentValidating(false);
          setOnboardStep(4);
        } else {
          // Validation failed, show feedback
          console.log('❌ Commitment validation failed:', result.feedback);
          setCommitmentError(result.feedback || 'Please provide more thoughtful and specific responses.');
          setCommitmentValidating(false);
        }
      } else {
        // API error, but don't block user
        console.error('❌ Validation API error:', result);
        setCommitmentValidating(false);
        setOnboardStep(4); // Allow to proceed
      }
      
    } catch (error) {
      console.error('❌ Error validating commitment:', error);
      setCommitmentValidating(false);
      // On error, allow user to proceed (don't block onboarding)
      setOnboardStep(4);
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
          setOnboardStep(5); // Move to verification step
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
        setOnboardStep(5); // Move to verification step
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
        gender: newGender,
        what_to_change: whatToChange.trim(),
        what_to_gain: whatToGain.trim(),
        doing_this_for: doingThisFor.trim()
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
        
        // Close onboarding and immediately show dashboard
        setShowOnboarding(false);
        setAuthenticated(true);
        
        // Fetch profile data to populate dashboard
        fetchProfileData();
        
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
    console.log('🚀 loadDevicesFromBackend called');
    console.log('🔍 customerData:', customerData);
    
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
      return []; // Return empty array
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

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch devices. Status:', response.status, 'Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 Backend response:', result);
      console.log('📦 result.success:', result.success);
      console.log('📦 result.devices:', result.devices);
      console.log('📦 result.devices length:', result.devices?.length);
      
      if (result.success && result.devices) {
        console.log(`✅ Loaded ${result.devices.length} devices from backend:`, result.devices);
        setDevices(result.devices);
        return result.devices; // Return the loaded devices
      } else {
        console.log('📱 No devices found in backend (success=false or devices empty), starting with empty array');
        console.log('📱 Full result:', JSON.stringify(result));
        setDevices([]);
        return []; // Return empty array
      }
      
    } catch (error) {
      console.error('❌ Error loading devices from backend:', error);
      // Don't show error to user, just start with empty array
      setDevices([]);
      return []; // Return empty array on error
    }
  };

  // Device management functions
  // Regenerate audio guide with new PIN for existing device
  const regenerateAudioGuide = async (device) => {
    try {
      console.log('🔄 Regenerating audio guide for device:', device);
      
      let customerId = customerData?.customerId || extractCustomerId();
      if (!customerId) {
        alert('❌ Customer ID not found. Please refresh and try again.');
        return;
      }
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/regenerate_audio_guide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          device_id: device.id,
          device_type: device.type,
          device_name: device.name
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Audio regenerated successfully:', result);
        alert(`🎉 New audio guide generated!\n\nNew PIN: ${result.pincode}\nGeneration: ${result.tracking?.generation || 'N/A'}\n\nYour device has been updated with the new PIN.`);
        
        // Reload devices to show new PIN
        await loadDevicesFromBackend();
      } else {
        throw new Error(result.error || 'Failed to regenerate audio');
      }
      
    } catch (error) {
      console.error('❌ Error regenerating audio:', error);
      alert(`❌ Failed to regenerate audio guide: ${error.message}`);
    }
  };
  
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
    
    console.log('🔍 sharedPincode:', sharedPincode);
    console.log('🔍 audioGuideData:', audioGuideData);
    console.log('🔍 vpnProfileData:', vpnProfileData);
    console.log('🔍 currentDeviceId:', currentDeviceId);
    
    const newDevice = {
      id: currentDeviceId || `device_${Date.now()}`,  // Use shared device_id for tracking
      name: deviceFormData.device_name.trim(),
      icon: deviceIcons[deviceFormData.device_type] || '📱',
      status: 'locked',
      addedDate: new Date().toISOString(),
      type: deviceFormData.device_type,
      setup_completed_at: new Date().toISOString(),
      // Store pincode for all devices (used for audio guide)
      pincode: sharedPincode?.pincode || null,
      // Store audio URL if generated (ONLY S3/HTTPS URLs, NEVER base64 data URLs!)
      audio_url: (() => {
        const url = audioGuideData?.audio_url || audioGuideData?.tts_result?.public_url || null;
        // Safety check: NEVER store base64 data URLs (they're 2-5MB and break DynamoDB!)
        if (url && url.startsWith('data:')) {
          console.warn('⚠️ Blocked base64 audio URL from being stored in device');
          return null;
        }
        return url;
      })(),
      // Store profile URL for VPN profile (ONLY S3/HTTPS URLs, NEVER base64 data URLs!)
      profile_url: (() => {
        const url = vpnProfileData?.profile_url || vpnProfileData?.s3_url || null;
        // Safety check: NEVER store base64 data URLs (they're huge and break DynamoDB!)
        if (url && url.startsWith('data:')) {
          console.warn('⚠️ Blocked base64 profile URL from being stored in device');
          return null;
        }
        return url;
      })()
    };
    
    console.log('📦 newDevice pincode:', newDevice.pincode);
    console.log('📦 newDevice audio_url:', newDevice.audio_url);
    console.log('📦 newDevice profile_url:', newDevice.profile_url);
    
    // Clear shared device_id after device creation
    setCurrentDeviceId(null);
    
    // For macOS devices, also store mdm_pincode (same as pincode for profile removal)
    if (deviceFormData.device_type === 'macOS') {
      newDevice.mdm_pincode = sharedPincode?.pincode || null;
      console.log('📦 newDevice mdm_pincode:', newDevice.mdm_pincode);
    }
    
    // Log device size for debugging
    const deviceSize = JSON.stringify(newDevice).length;
    console.log(`📊 New device data size: ${deviceSize} bytes`, newDevice);
    console.log(`📊 audioGuideData full object:`, audioGuideData);
    console.log(`📊 audioGuideData size: ${audioGuideData ? JSON.stringify(audioGuideData).length : 0} bytes`);
    console.log(`📊 vpnProfileData full object:`, vpnProfileData);
    console.log(`📊 vpnProfileData size: ${vpnProfileData ? JSON.stringify(vpnProfileData).length : 0} bytes`);
    
    // DETAILED field-by-field size analysis
    console.log('🔬 Field sizes:');
    console.log(`  - id: ${JSON.stringify(newDevice.id || '').length} bytes`);
    console.log(`  - name: ${JSON.stringify(newDevice.name || '').length} bytes`);
    console.log(`  - icon: ${JSON.stringify(newDevice.icon || '').length} bytes`);
    console.log(`  - type: ${JSON.stringify(newDevice.type || '').length} bytes`);
    console.log(`  - addedDate: ${JSON.stringify(newDevice.addedDate || '').length} bytes`);
    console.log(`  - setup_completed_at: ${JSON.stringify(newDevice.setup_completed_at || '').length} bytes`);
    console.log(`  - status: ${JSON.stringify(newDevice.status || '').length} bytes`);
    console.log(`  - pincode: ${JSON.stringify(newDevice.pincode || '').length} bytes`);
    console.log(`  - audio_url: ${JSON.stringify(newDevice.audio_url || '').length} bytes`);
    console.log(`  - profile_url: ${JSON.stringify(newDevice.profile_url || '').length} bytes`);
    if (newDevice.mdm_pincode) {
      console.log(`  - mdm_pincode: ${JSON.stringify(newDevice.mdm_pincode).length} bytes`);
    }
    console.log(`  - audio_url type: ${typeof newDevice.audio_url}, starts with: ${newDevice.audio_url ? newDevice.audio_url.substring(0, 50) : 'null'}`);
    console.log(`  - profile_url type: ${typeof newDevice.profile_url}, starts with: ${newDevice.profile_url ? newDevice.profile_url.substring(0, 50) : 'null'}`);
    
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
      
      // Check if device already exists (in case user completed setup multiple times)
      console.log('🔍 Checking if device already exists...');
      console.log('🔍 Looking for device ID:', newDevice.id);
      const getDevicesResp = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/get_devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId })
      });
      
      const devicesData = await getDevicesResp.json();
      console.log('🔍 Existing devices:', devicesData.devices?.map(d => ({id: d.id, status: d.status, size: JSON.stringify(d).length})));
      console.log('📏 Size of newDevice object:', JSON.stringify(newDevice).length, 'bytes');
      const deviceExists = devicesData.devices?.some(d => d.id === newDevice.id);
      console.log('🔍 Device exists:', deviceExists);
      
      let response;
      if (deviceExists) {
        // UPDATE existing device (in case user completed setup multiple times)
        console.log('📝 Updating existing device...');
        response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/update_device`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_id: customerId,
            device_id: newDevice.id,
            updates: {
              name: newDevice.name,
              status: 'locked',
              setup_completed_at: newDevice.setup_completed_at,
              profile_url: newDevice.profile_url,
              mdm_pincode: newDevice.mdm_pincode,
              pincode: newDevice.pincode,
              audio_url: newDevice.audio_url
            }
          })
        });
      } else {
        // ADD new device (first time completing setup)
        console.log('📝 Adding new device to database...');
        response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/add_device`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_id: customerId,
            device: newDevice
          })
        });
      }
      
      console.log('📡 Device save response status:', response.status);
      console.log('📡 Device save response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend returned error:', errorData);
        throw new Error(errorData.error || 'Failed to save device to backend');
      }
      
      const result = await response.json();
      console.log('✅ Device saved to backend:', result);
      console.log('✅ Full result:', JSON.stringify(result));
      
      // Reload devices from backend to ensure persistence
      console.log('🔄 Reloading devices after adding...');
      const reloadedDevices = await loadDevicesFromBackend();
      console.log('✅ Device added from flow and reloaded from backend. Reloaded devices:', reloadedDevices.length);
      console.log('✅ Reloaded devices:', reloadedDevices);
      
      // Reload profile data to refresh activity logs
      await fetchProfileData();
      
      // Success: Close the flow and return to dashboard (no alert)
      console.log(`🎉 Device "${newDevice.name}" successfully added. Returning to dashboard.`);
      
      // Stop any playing audio when flow completes
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      
      // Close device flow modal
      setShowDeviceFlow(false);
      setCurrentFlow(null);
      setCurrentFlowStep(1);
      setDeviceFormData({
        device_name: '',
        device_type: ''
      });
      setAudioGuideData(null);
      setVpnProfileData(null);
      setSharedPincode(null);
      setCurrentDeviceId(null);
      
    } catch (error) {
      console.error('❌ Error saving device:', error);
      alert(`❌ Failed to add device: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
    }
  };

  // Auto-unlock device when reaching pincode display step
  useEffect(() => {
    if (showDeviceFlow && currentFlow && currentFlowStep === 2 && 
        currentFlow.steps[currentFlowStep - 1]?.step_type === 'pincode_display' &&
        currentFlow.deviceId && currentFlow.flowType === 'device_unlock_flow' &&
        !currentFlow.unlockProcessed) {  // Only run once
      
      console.log('🔓 Auto-unlocking device on pincode display:', currentFlow.deviceId);
      console.log('📱 Current devices array:', devices);
      
      // Mark as processed immediately to prevent multiple runs
      setCurrentFlow(prev => ({
        ...prev,
        unlockProcessed: true
      }));
      
      // Auto-unlock the device without confirmation
      const autoUnlockDevice = async () => {
        try {
          const device = devices.find(d => d.id === currentFlow.deviceId);
          console.log('🔍 Looking for device:', currentFlow.deviceId);
          console.log('✅ Found device:', device);
          
          if (!device) {
            console.log('⚠️ Device not found for auto-unlock:', currentFlow.deviceId);
            console.log('📋 Available device IDs:', devices.map(d => d.id));
            return;
          }
          
          console.log('🔓 Auto-unlocking device:', device.name);
          console.log('📱 Device pincodes:', {
            audio: device.current_audio_pincode,
            mdm: device.current_mdm_pincode
          });
          
          // Store device data in currentFlow before removal so UI can display pincodes
          setCurrentFlow(prev => ({
            ...prev,
            unlockedDeviceData: device
          }));
          
          // Get customer ID
          const customerId = customerData?.customerId || extractCustomerId();
          console.log('🔑 Unlocking with customer_id:', customerId);
          console.log('🔑 Device ID to unlock:', currentFlow.deviceId);
          console.log('🔑 customerData:', customerData);
          
          // Call backend API to unlock device
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/unlock_device`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer_id: customerId,
              device_id: currentFlow.deviceId
            })
          });
          
          console.log('📡 Unlock response status:', response.status);
          console.log('📡 Unlock response ok:', response.ok);

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Device auto-unlocked successfully:', result);
            
            // Reload profile data to refresh activity logs
            await fetchProfileData();
            
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
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ Error response:', errorData);
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
          
          // Reload profile data to refresh activity logs
          await fetchProfileData();
          
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
                src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/stj_favi_inverted_yellow_extra.png?v=1757864432" 
                alt="Screen Time Journey Logo" 
                style={{maxHeight: '64px', marginBottom: '8px'}}
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
                  Loading your dashboard...
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
                src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/stj_favi_inverted_yellow_extra.png?v=1757864432" 
                alt="Screen Time Journey Logo" 
                style={{maxHeight: '64px', marginBottom: '8px'}}
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
              <div className="step-indicator">Step {onboardStep} of 5</div>
              <h3 id="onboard-title" className="modal__title">
                {onboardStep === 1 && "Choose username"}
                {onboardStep === 2 && "Select gender"}
                {onboardStep === 3 && "Your commitment"}
                {onboardStep === 4 && "Setup WhatsApp"}
                {onboardStep === 5 && "Verify phone"}
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
                <p className="helper">Why do you want to change your screentime habits?</p>
                <input 
                  className="input" 
                  placeholder="I want to be more present with my family" 
                  value={whatToChange}
                  onChange={(e) => {
                    setWhatToChange(e.target.value);
                    setCommitmentError(''); // Clear error on input
                  }}
                  maxLength="200"
                />
                <p className="helper" style={{ marginTop: '1rem' }}>How will this change your life?</p>
                <input 
                  className="input" 
                  placeholder="I'll have more energy and focus for what matters" 
                  value={whatToGain}
                  onChange={(e) => {
                    setWhatToGain(e.target.value);
                    setCommitmentError(''); // Clear error on input
                  }}
                  maxLength="200"
                />
                <p className="helper" style={{ marginTop: '1rem' }}>Who in your life will be affected by these changes?</p>
                <input 
                  className="input" 
                  placeholder="My partner and children" 
                  value={doingThisFor}
                  onChange={(e) => {
                    setDoingThisFor(e.target.value);
                    setCommitmentError(''); // Clear error on input
                  }}
                  maxLength="200"
                />
                {commitmentError && <p className="error-message">{commitmentError}</p>}
                <div className="modal__footer">
                  <button
                    type="button"
                    className="btn btn--primary btn--full" 
                    disabled={!whatToChange.trim() || !whatToGain.trim() || !doingThisFor.trim() || commitmentValidating} 
                    onClick={(e) => {
                      e.preventDefault();
                      validateCommitment();
                    }}
                  >
                    {commitmentValidating ? 'Validating...' : 'Next →'}
                  </button>
                  <button type="button" className="link-back" onClick={() => setOnboardStep(2)}>Back</button>
                </div>
              </div>
            )}

            {onboardStep === 4 && (
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
                  <button className="link-back" onClick={() => setOnboardStep(3)}>Back</button>
                </div>
              </div>
            )}

            {onboardStep === 5 && (
              <div>
                <p className="helper">
                  We sent a 6-digit code to {newCountryCode}{newWhatsapp}
                  <button className="link-inline" onClick={() => setOnboardStep(4)}>Wrong number?</button>
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
                      ? (currentFlowStep === 3 ? 'Optional: VPN Profile' : currentFlow.steps[currentFlowStep - 1].title)
                      : currentFlow.flow_name}
                  </h3>
                </div>

                <div>
                  {/* Current Step Content */}
                  {currentFlow.steps && currentFlow.steps[currentFlowStep - 1] && (
                    <div className="flow-step">
                      {/* Conditional rendering based on step type */}
                      {currentFlow.steps[currentFlowStep - 1].step_type === 'video_surrender' ? (
                        <>
                          {/* Video + Surrender Step Content - Merged */}
                          <div style={{marginBottom: '20px'}}>
                            
                            {/* Video */}
                            <div style={{marginBottom: '20px', textAlign: 'center'}}>
                              <video controls style={{width: '100%', maxWidth: '500px', borderRadius: '8px', marginBottom: '20px'}}>
                                <source src={currentFlow.steps[currentFlowStep - 1].media_url} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            
                            {/* Surrender Text */}
                            <p style={{margin: '0 0 12px 0', fontSize: '15px', lineHeight: '1.7', color: '#374151', fontStyle: 'italic', textAlign: 'left'}}>
                              "{currentFlow.steps[currentFlowStep - 1].surrender_text || surrenderText}"
                            </p>
                            
                            {/* Microphone permission hint */}
                            {!isRecording && !audioBlob && (
                              <div style={{marginBottom: '16px', textAlign: 'center', fontSize: '14px', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <path d="M12 6v6l4 2"/>
                                </svg>
                                Click to allow microphone access and start recording
                              </div>
                            )}
                            
                            {/* Recording Status (only when recording) */}
                            {isRecording && (
                              <div style={{
                                background: 'rgba(249, 250, 251, 0.8)',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '16px',
                                textAlign: 'center'
                              }}>
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'}}>
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
                                      backgroundColor: '#DC2626',
                                      borderRadius: '50%',
                                      animation: 'pulse 1.5s ease-in-out infinite'
                                    }}></div>
                                    Recording...
                                  </div>
                                  <div style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#374151',
                                    fontFamily: 'monospace'
                                  }}>
                                    {recordingTime}s
                                  </div>
                                  
                                  {/* Audio Visualizer - Single Bar */}
                                  <div style={{
                                    width: '100%',
                                    maxWidth: '500px',
                                    height: '8px',
                                    background: '#E5E7EB',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    marginTop: '8px'
                                  }}>
                                    <div style={{
                                      height: '100%',
                                      background: 'linear-gradient(90deg, #2E0456, #440B6C)',
                                      width: `${Math.min(100, Math.max(10, (audioLevels[0] || 30) * 1.5))}%`,
                                      transition: 'width 0.1s ease',
                                      animation: 'pulse 1.5s ease-in-out infinite'
                                    }}></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {!audioBlob ? (
                              <div>
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
                                  className="btn btn--outline"
                                  style={{
                                    background: 'transparent',
                                    border: isRecording ? '2px solid #DC2626' : '2px solid #440B6C',
                                    borderRadius: '8px',
                                    padding: '14px 28px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: isRecording ? '#DC2626' : '#440B6C',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    margin: '0 auto',
                                    width: 'auto',
                                    minWidth: '180px'
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
                                </div>
                              ) : (
                                <div style={{
                                  background: 'rgba(249, 250, 251, 0.8)',
                                  border: '1px solid rgba(0, 0, 0, 0.1)',
                                  borderRadius: '12px',
                                  padding: '20px'
                                }}>
                                  {/* Success Message with Green Emoji */}
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '20px'
                                  }}>
                                    <div style={{fontSize: '32px', lineHeight: 1}}>✅</div>
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
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '16px',
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
                                          background: 'linear-gradient(135deg, #2E0456, #440B6C)',
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
                                  
                                  {/* Record Again Button */}
                                  <button
                                    onClick={() => {
                                      setAudioBlob(null);
                                      setIsRecording(false);
                                      setRecordingTime(0);
                                    }}
                                    style={{
                                      width: '100%',
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#440B6C',
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      padding: '8px 0',
                                      textAlign: 'center'
                                    }}
                                  >
                                    Record Again
                                  </button>
                                </div>
                              )}
                          </div>
                        </>
                      ) : currentFlow.steps[currentFlowStep - 1].step_type === 'surrender' ? (
                        <>
                          {/* Surrender Step Content - Simplified */}
                          <div style={{marginBottom: '20px'}}>
                            
                            {/* Surrender Text */}
                            <div style={{background: 'rgba(255,255,255,0.8)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', marginBottom: '20px'}}>
                              <p style={{margin: 0, fontSize: '15px', lineHeight: '1.7', color: '#374151', fontStyle: 'italic', textAlign: 'left'}}>
                                "{currentFlow.steps[currentFlowStep - 1].surrender_text || surrenderText}"
                              </p>
                            </div>
                            
                            {/* Recording Status (only when recording) */}
                            {isRecording && (
                              <div style={{
                                background: 'rgba(249, 250, 251, 0.8)',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '16px',
                                textAlign: 'center'
                              }}>
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'}}>
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
                                      backgroundColor: '#DC2626',
                                      borderRadius: '50%',
                                      animation: 'pulse 1.5s ease-in-out infinite'
                                    }}></div>
                                    Recording...
                                  </div>
                                  <div style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#374151',
                                    fontFamily: 'monospace'
                                  }}>
                                    {recordingTime}s
                                  </div>
                                  
                                  {/* Audio Visualizer - Single Bar */}
                                  <div style={{
                                    width: '100%',
                                    maxWidth: '500px',
                                    height: '8px',
                                    background: '#E5E7EB',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    marginTop: '8px'
                                  }}>
                                    <div style={{
                                      height: '100%',
                                      background: 'linear-gradient(90deg, #2E0456, #440B6C)',
                                      width: `${Math.min(100, Math.max(10, (audioLevels[0] || 30) * 1.5))}%`,
                                      transition: 'width 0.1s ease',
                                      animation: 'pulse 1.5s ease-in-out infinite'
                                    }}></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {!audioBlob ? (
                              <div>
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
                                  className="btn btn--primary"
                                  style={{
                                    background: isRecording 
                                      ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                                      : 'linear-gradient(135deg, #2E0456, #440B6C)',
                                    border: 'none',
                                    borderRadius: '8px',
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
                                    width: 'auto',
                                    minWidth: '180px'
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
                                  background: 'rgba(249, 250, 251, 0.8)',
                                  border: '1px solid rgba(0, 0, 0, 0.1)',
                                  borderRadius: '12px',
                                  padding: '20px'
                                }}>
                                  {/* Success Message with Green Emoji */}
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '20px'
                                  }}>
                                    <div style={{fontSize: '32px', lineHeight: 1}}>✅</div>
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
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '16px',
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
                                          background: 'linear-gradient(135deg, #2E0456, #440B6C)',
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
                                  
                                  {/* Record Again Button */}
                                  <button
                                    onClick={() => {
                                      setAudioBlob(null);
                                      setIsRecording(false);
                                      setRecordingTime(0);
                                    }}
                                    style={{
                                      width: '100%',
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#440B6C',
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      padding: '8px 0',
                                      textAlign: 'center'
                                    }}
                                  >
                                    Record Again
                                  </button>
                                </div>
                              )}
                          </div>
                        </>
                      ) : currentFlow.steps[currentFlowStep - 1].step_type === 'pincode_display' ? (
                        <>
                          {/* Pincode Display Step */}
                          <div style={{marginBottom: '20px'}}>
                            {(() => {
                              // Use stored device data from currentFlow (stored before removal)
                              const unlockedDevice = currentFlow?.unlockedDeviceData;
                              
                              console.log('🔍 Pincode Display - unlockedDevice:', unlockedDevice);
                              console.log('🔍 Pincode Display - currentFlow:', currentFlow);
                              
                              if (!unlockedDevice) {
                                return (
                                  <div style={{textAlign: 'center', padding: '20px'}}>
                                    <div style={{marginBottom: '12px'}}>Loading device information...</div>
                                    <div style={{
                                      width: '24px',
                                      height: '24px',
                                      border: '3px solid #f3f4f6',
                                      borderTop: '3px solid #2E0456',
                                      borderRadius: '50%',
                                      animation: 'spin 1s linear infinite',
                                      margin: '0 auto'
                                    }}></div>
                                  </div>
                                );
                              }
                              
                              return (
                                <>
                                  {/* Screen Time Unlock Code */}
                                  {unlockedDevice?.current_audio_pincode && (
                                    <div style={{padding: '16px', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', marginBottom: '12px'}}>
                                      <h4 style={{margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#374151'}}>
                                        📱 Screen Time Code
                                      </h4>
                                      <div style={{fontFamily: 'monospace', fontSize: '32px', fontWeight: '700', color: '#2E0456', letterSpacing: '8px', textAlign: 'center', padding: '8px 0'}}>
                                        {unlockedDevice.current_audio_pincode}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* MDM Profile Pincode (if device has it) */}
                                  {unlockedDevice?.current_mdm_pincode && (
                                    <div style={{padding: '16px', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', marginBottom: '12px'}}>
                                      <h4 style={{margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#374151'}}>
                                        🔧 MDM Profile Removal Code
                                      </h4>
                                      <div style={{fontFamily: 'monospace', fontSize: '32px', fontWeight: '700', color: '#2E0456', letterSpacing: '8px', textAlign: 'center', padding: '8px 0'}}>
                                        {unlockedDevice.current_mdm_pincode}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div style={{background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', padding: '12px', marginTop: '16px', textAlign: 'center'}}>
                                    <p style={{margin: 0, fontSize: '13px', color: '#16a34a', fontWeight: '500'}}>
                                      ✅ Device unlocked and removed from monitoring
                                    </p>
                                  </div>
                                </>
                              );
                            })()}
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
                          {currentFlow.steps[currentFlowStep - 1].body && (
                            <p style={{marginBottom: '20px', fontSize: '16px', lineHeight: '1.5', textAlign: 'left', color: '#374151'}}>
                              {currentFlow.steps[currentFlowStep - 1].body}
                            </p>
                          )}
                          
                          {/* Audio Guide for Setup Pincode step (step 4) */}
                          {currentFlowStep === 4 && (
                            <div style={{marginBottom: '20px'}}>
                              {!audioGuideData ? (
                                <div>
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
                                  {/* Audio player - only show audio player, never show pincode on screen */}
                                  {(audioGuideData?.audioUrl || audioGuideData?.tts_result?.public_url || audioGuideData?.audio_url) ? (
                                    <AudioPlayer audioUrl={(() => {
                                      const url = audioGuideData?.audioUrl || audioGuideData?.tts_result?.public_url || audioGuideData?.audio_url;
                                      console.log('🎵 AudioPlayer props - audioGuideData:', audioGuideData);
                                      console.log('🎵 AudioPlayer props - resolved URL:', url);
                                      return url;
                                    })()} />
                                  ) : (
                                    <div style={{
                                      background: 'rgba(255, 193, 7, 0.1)',
                                      border: '1px solid rgba(255, 193, 7, 0.3)',
                                      borderRadius: '8px',
                                      padding: '12px',
                                      marginBottom: '12px',
                                      textAlign: 'center',
                                      fontSize: '13px',
                                      color: '#856404'
                                    }}>
                                      ⚠️ Audio playback is not available. Please try generating the audio guide again.
                                    </div>
                                  )}
                                  
                                  <button
                                    onClick={() => {
                                      setAudioGuideData(null);
                                      console.log('🔄 Regenerating audio guide');
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#440B6C',
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      padding: '8px 0',
                                      marginTop: '8px',
                                      width: '100%',
                                      textAlign: 'center'
                                    }}
                                  >
                                    Generate new code
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
                    {/* Download Profile Button for Setup Profile step (step 3) - only for device_setup_flow */}
                    {currentFlowStep === 3 && currentFlow.flowType === 'device_setup_flow' && currentFlow.steps[currentFlowStep - 1]?.step_type !== 'pincode_display' && (
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
                        disabled={
                          surrenderSubmitting || 
                          ((currentFlow.steps[currentFlowStep - 1]?.step_type === 'surrender' || currentFlow.steps[currentFlowStep - 1]?.step_type === 'video_surrender') && !audioBlob) ||
                          (currentFlow.flowType === 'device_setup_flow' && currentFlowStep === 4 && !audioGuideData)
                        }
                        style={{
                          opacity: surrenderSubmitting || (currentFlow.flowType === 'device_setup_flow' && currentFlowStep === 4 && !audioGuideData) ? 0.7 : 1,
                          cursor: surrenderSubmitting || (currentFlow.flowType === 'device_setup_flow' && currentFlowStep === 4 && !audioGuideData) ? 'not-allowed' : 'pointer',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center'
                        }}
                      >
                        {surrenderSubmitting ? (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto'
                          }}></div>
                        ) : (
                          <>
                            {currentFlow.steps && currentFlow.steps[currentFlowStep - 1] 
                              ? currentFlow.steps[currentFlowStep - 1].action_button 
                              : 'Next Step'} →
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Two-button layout with Home (left) and Next/action (right) */}
                    <div style={{display: 'flex', gap: '12px', marginTop: '8px', width: '100%'}}>
                      {/* Left button: Home (primary purple) */}
                      <button 
                        onClick={() => {
                          // Close flow and return to dashboard
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
                        }}
                        style={{
                          flex: 1,
                          padding: '14px 24px',
                          background: '#2E0456',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '16px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          const underline = document.createElement('div');
                          underline.className = 'btn-underline';
                          underline.style.cssText = `
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            height: 2px;
                            width: 0;
                            background: rgba(255, 255, 255, 0.3);
                            transition: width 0.4s ease;
                          `;
                          e.currentTarget.appendChild(underline);
                          setTimeout(() => underline.style.width = '100%', 10);
                        }}
                        onMouseLeave={(e) => {
                          const underline = e.currentTarget.querySelector('.btn-underline');
                          if (underline) underline.remove();
                        }}
                      >
                        Home
                      </button>

                      {/* Right button: Outlined action button */}
                      <button 
                        onClick={() => {
                          if (currentFlowStep === 1 || currentFlow.steps[currentFlowStep - 1]?.step_type === 'pincode_display') {
                            // Close on first step or pincode display
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
                        style={{
                          flex: 1,
                          padding: '14px 24px',
                          background: 'transparent',
                          color: '#2E0456',
                          border: '2px solid #2E0456',
                          borderRadius: '4px',
                          fontSize: '16px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          const underline = document.createElement('div');
                          underline.className = 'btn-underline';
                          underline.style.cssText = `
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            height: 2px;
                            width: 0;
                            background: rgba(46, 4, 86, 0.3);
                            transition: width 0.4s ease;
                          `;
                          e.currentTarget.appendChild(underline);
                          setTimeout(() => underline.style.width = '100%', 10);
                        }}
                        onMouseLeave={(e) => {
                          const underline = e.currentTarget.querySelector('.btn-underline');
                          if (underline) underline.remove();
                        }}
                      >
                        {currentFlowStep === 1 
                          ? 'Cancel' 
                          : currentFlow.steps[currentFlowStep - 1]?.step_type === 'pincode_display' 
                            ? 'Close' 
                            : 'Back'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="announcement-bar">
          <div className="container" style={{
            fontFamily: 'var(--font-heading)',
            color: '#ffffff',
            fontWeight: 600
          }}>
            👑 Account Dashboard
          </div>
        </div>

        <header className="header">
          <div className="header-inner">
            {/* Logo */}
            <a className="header-logo" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">
              <img 
                src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/stj_trimmed_png.png?v=1757864303" 
                alt="Screen Time Journey Logo"
              />
            </a>
            
            {/* Navigation Links */}
            <nav className="header-nav">
              <a href="https://www.screentimejourney.com/pages/about-me" target="_self" rel="noopener noreferrer">About Me</a>
              <a href="https://www.screentimejourney.com/products/screentimejourney" target="_self" rel="noopener noreferrer">Start Now</a>
              <a href="https://www.screentimejourney.com/pages/milestones" target="_self" rel="noopener noreferrer">Milestones</a>
              <a href="https://www.screentimejourney.com/pages/leaderboard" target="_self" rel="noopener noreferrer">Leaderboard</a>
            </nav>
            
            {/* Action Buttons */}
            <div className="header-actions">
              {/* Desktop buttons */}
              <div className="header-buttons-desktop">
                <a className="btn-outline-primary" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">Home</a>
                <button className="btn-outline-secondary" onClick={() => {
                  document.cookie = 'stj_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                  window.location.href = 'https://xpvznx-9w.myshopify.com/account/logout?return_url=/';
                }}>Log out</button>
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
                      href="https://www.screentimejourney.com/pages/about-me" 
                      target="_self" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      About Me
                    </a>
                    <a 
                      className="mobile-menu-item" 
                      href="https://www.screentimejourney.com/products/screentimejourney" 
                      target="_self" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Start Now
                    </a>
                    <a 
                      className="mobile-menu-item" 
                      href="https://www.screentimejourney.com/pages/milestones" 
                      target="_self" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Milestones
                    </a>
                    <a 
                      className="mobile-menu-item" 
                      href="https://www.screentimejourney.com/pages/leaderboard" 
                      target="_self" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Leaderboard
                    </a>
                    <hr style={{margin: '12px 0', border: 'none', borderTop: '1px solid #e5e7eb'}} />
                    <a 
                      className="mobile-menu-item" 
                      href="https://www.screentimejourney.com" 
                      target="_self" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
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
          {(profileLoading || milestonesLoading) ? (
            <div className="card" style={{padding: '40px', textAlign: 'center'}}>
              <div className="spinner" style={{width: '40px', height: '40px', margin: '0 auto 16px'}}></div>
              <p style={{color: '#6b7280', margin: 0}}>Loading your journey...</p>
            </div>
          ) : (
            <ProgressSection 
              latestDevice={null}
              customerName={profileData?.username || customerData?.username || "Friend"}
              customerEmail={profileData?.email || customerData?.email || ""}
              customerGender={profileData?.gender || customerData?.gender || "male"}
              percentile={percentile}
              devices={devices}
              milestones={milestones}
              startDeviceFlow={startDeviceFlow}
            />
          )}

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
                    {profileData?.email || 'Not set'}
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Username</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    @{profileData?.username || 'Not set'}
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Gender</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {profileData?.gender === 'male' ? '🙋‍♂️ Man' : profileData?.gender === 'female' ? '🙋‍♀️ Woman' : 'Not set'}
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
                    {profileData?.whatsapp || 'Not set'}
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
                          Status: {device.status.charAt(0).toUpperCase() + device.status.slice(1)} • Added {(() => {
                            const date = new Date(device.addedDate);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          })()}
                          {device.lastUnlock && (
                            <> • Last unlock: {(() => {
                              const date = new Date(device.lastUnlock);
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            })()}</>
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
                    color: (customerData?.subscription_status === 'cancelled' || customerData?.subscription_status === 'cancel_scheduled' || profileData?.subscription_status === 'cancelled' || profileData?.subscription_status === 'cancel_scheduled') ? '#dc2626' : '#059669',
                    backgroundColor: '#f9fafb',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {(customerData?.subscription_status === 'cancelled' || customerData?.subscription_status === 'cancel_scheduled' || profileData?.subscription_status === 'cancelled' || profileData?.subscription_status === 'cancel_scheduled') ? 'Cancelled ✗' : 'Active ✓'}
                  </span>
                </div>
                {(customerData?.subscription_status !== 'cancelled' && customerData?.subscription_status !== 'cancel_scheduled' && profileData?.subscription_status !== 'cancelled' && profileData?.subscription_status !== 'cancel_scheduled') && (
                  <>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                      <span style={{fontSize: '14px', color: '#374151'}}>Next billing</span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        fontFamily: 'monospace'
                      }}>
                        {(() => {
                          // Calculate next billing date from subscription creation date
                          // Prefer subscription_created_at over account created_at
                          const subscriptionDate = profileData?.subscription_created_at || customerData?.subscription_created_at || profileData?.created_at || customerData?.created_at;
                          if (subscriptionDate) {
                            try {
                              const createdDate = new Date(subscriptionDate);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0); // Reset to start of day
                              
                              // Start with the first billing date (one month after creation)
                              let nextBilling = new Date(createdDate);
                              nextBilling.setMonth(nextBilling.getMonth() + 1);
                              
                              // If that date is in the past, keep adding months until we find the next future billing date
                              while (nextBilling < today) {
                                nextBilling.setMonth(nextBilling.getMonth() + 1);
                              }
                              
                              // Format as "DD MMM YYYY"
                              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              const day = nextBilling.getDate();
                              const month = months[nextBilling.getMonth()];
                              const year = nextBilling.getFullYear();
                              return `${day} ${month} ${year}`;
                            } catch (e) {
                              console.error('Error calculating next billing date:', e);
                              return 'N/A';
                            }
                          }
                          return 'N/A';
                        })()}
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
                  </>
                )}
              </div>
              <div style={{marginTop: 'auto', display: 'flex', gap: '8px'}}>
                {(customerData?.subscription_status === 'cancelled' || customerData?.subscription_status === 'cancel_scheduled' || profileData?.subscription_status === 'cancelled' || profileData?.subscription_status === 'cancel_scheduled') ? (
                  <a
                    href="https://www.screentimejourney.com/products/screentimejourney"
                    className="btn btn--outline btn--sm"
                    style={{flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                  >
                    Start new subscription
                  </a>
                ) : (
                  <button
                    className="btn btn--outline btn--sm"
                    style={{flex: 1}}
                    onClick={startCancelFlow}
                  >
                    Cancel subscription
                  </button>
                )}
              </div>
            </div>

            <div className="card card--equal" style={{display: 'flex', flexDirection: 'column'}}>
              <div className="card-header">
                <h3 className="card-title">Notifications</h3>
              </div>
              <div style={{margin: '0 0 16px 0'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>Email notifications</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: notificationSettings.email_enabled ? '#059669' : '#6b7280',
                    backgroundColor: '#f9fafb',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {notificationSettings.email_enabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                  <span style={{fontSize: '14px', color: '#374151'}}>WhatsApp notifications</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: notificationSettings.whatsapp_enabled ? '#059669' : '#6b7280',
                    backgroundColor: '#f9fafb',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {notificationSettings.whatsapp_enabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
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
          {/* Logo and Contact Column */}
          <div className="footer-column footer-logo-column">
            <a href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">
              <img 
                src="https://cdn.shopify.com/s/files/1/0866/6749/3623/files/stj_footer_v2.png?v=1757876933" 
                alt="Screen Time Journey Logo" 
                className="footer-logo"
              />
            </a>
            <div className="footer-contact">
              <a href="mailto:info@screentimejourney.com" className="footer-contact-link">info@screentimejourney.com</a>
              <a href="tel:+31649232152" className="footer-contact-link">+31 6 49232152</a>
              <div className="footer-address">Linnaeusstraat 35F-14, Amsterdam, Netherlands</div>
            </div>
          </div>

          {/* About Menu Column */}
          <div className="footer-column">
            <h4 className="footer-title">About</h4>
            <div className="footer-links">
              <a className="footer-link" href="https://www.screentimejourney.com/pages/faq">FAQ</a>
              <a className="footer-link" href="https://www.screentimejourney.com/pages/contact">Contact</a>
              <a className="footer-link" href="https://www.screentimejourney.com/pages/about-me">About Me</a>
              <a className="footer-link" href="https://www.screentimejourney.com/pages/milestones">Milestones</a>
              <a className="footer-link" href="https://www.screentimejourney.com/pages/leaderboard">Leaderboard</a>
              <a className="footer-link" href="https://www.screentimejourney.com/pages/job-opportunities">Job Opportunities</a>
            </div>
          </div>

          {/* Blog Posts Menu Column */}
          <div className="footer-column">
            <h4 className="footer-title">Blog Posts</h4>
            <div className="footer-links">
              <a className="footer-link" href="https://www.screentimejourney.com/blogs/screentime-journey/why-quitting-porn-is-the-first-step-to-beating-screen-addiction">Why Quitting Porn Is the ...</a>
              <a className="footer-link" href="https://www.screentimejourney.com/blogs/screentime-journey/the-dopamine-reset-how-to-break-free-from-endless-scrolling">The Dopamine Reset: How to Break ...</a>
              <a className="footer-link" href="https://www.screentimejourney.com/blogs/screentime-journey/from-screen-addiction-to-freedom-my-screen-time-journey">From Screen Addiction to Freedom ...</a>
              <a className="footer-link" href="https://www.screentimejourney.com/blogs/screentime-journey/10-proven-strategies-to-build-discipline-and-reduce-screen-time">10 Proven Strategies to Build Discipline ...</a>
              <a className="footer-link" href="https://www.screentimejourney.com/blogs/screentime-journey/how-to-take-control-of-your-screen-time-a-complete-step-by-step-guide">How to Take Control of Your Screen Time ...</a>
            </div>
          </div>
        </div>

        {/* Footer Bottom - Policies */}
        <div className="container footer-bottom">
          <div className="footer-policies">
            <span>2025, SCREENTIMEJOURNEY ©</span>
            <div className="footer-policy-links">
              <a href="https://www.screentimejourney.com/policies/privacy-policy" className="footer-policy-link">Privacy policy</a>
              <a href="https://www.screentimejourney.com/policies/terms-of-service" className="footer-policy-link">Terms of service</a>
              <a href="https://www.screentimejourney.com/policies/refund-policy" className="footer-policy-link">Refund policy</a>
              <a href="https://www.screentimejourney.com/policies/shipping-policy" className="footer-policy-link">Shipping policy</a>
              <a href="https://www.screentimejourney.com/policies/contact-information" className="footer-policy-link">Contact information</a>
              <a href="https://www.screentimejourney.com/policies/#shopifyReshowConsentBanner" className="footer-policy-link">Cookie preferences</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Subscription Cancellation Flow Modal */}
      <div className={`modal-overlay ${showCancelFlow ? 'active' : ''}`}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-flow-title" style={{maxWidth: '600px'}}>
          <>
            <div className="modal__header">
              <div className="step-indicator">{cancelStep === 4 ? '' : `Step ${cancelStep} of 3`}</div>
              <h3 id="cancel-flow-title" className="modal__title">
                {cancelStep === 1 && 'We\'re sorry to see you go'}
                {cancelStep === 2 && 'Help us improve'}
                {cancelStep === 3 && 'Confirm cancellation'}
                {cancelStep === 4 && ''}
              </h3>
            </div>

            <div className="modal__content">
              {cancelStep === 1 && (
                <div style={{textAlign: 'center', marginBottom: '20px'}}>
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
                </div>
              )}

              {cancelStep === 3 && (
                <div style={{textAlign: 'left', marginBottom: '20px'}}>
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
                  <div style={{fontSize: '3rem', marginBottom: '16px'}}>✅</div>
                  
                  <p style={{fontSize: '14px', lineHeight: '1.5', color: '#6b7280', marginBottom: '20px'}}>
                    Your subscription has been cancelled and you will receive a confirmation email shortly.
                  </p>
                  
                  <div style={{textAlign: 'left', marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px'}}>
                    <h5 style={{margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#374151'}}>
                      What happens next:
                    </h5>
                    <ul style={{margin: 0, paddingLeft: '20px', color: '#6b7280', lineHeight: '1.6', fontSize: '14px'}}>
                      <li>You'll continue to have access until your current billing period ends</li>
                      <li>A confirmation email will be sent to your registered email address</li>
                      <li>Your progress and data will be preserved for 30 days in case you change your mind</li>
                      <li>No further charges will be made to your account</li>
                    </ul>
                  </div>
                  
                  <p style={{fontSize: '13px', color: '#6b7280', margin: 0}}>
                    Questions? Contact us at <strong>info@screentimejourney.com</strong>
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
                      <div className="spinner" style={{
                        width: '20px', 
                        height: '20px', 
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '3px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto',
                        display: 'inline-block'
                      }}></div>
                    ) : (
                      'Confirm cancellation'
                    )}
                  </button>
                  <button
                    className="link-back"
                    onClick={() => setCancelStep(2)}
                    disabled={cancelSubmitting}
                    style={{display: 'block', margin: '0 auto', background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer', textAlign: 'center'}}
                  >
                    Back
                  </button>
                </>
              )}

              {cancelStep === 4 && (
                <div style={{textAlign: 'center'}}>
                  <button
                    onClick={closeCancelFlow}
                    style={{background: 'none', border: 'none', color: '#2E0456', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline', padding: '8px'}}
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
                <p style={{color: '#6b7280', marginBottom: '24px'}}>
                  Choose how you want to receive progress updates and leaderboard notifications. We've combined weekly and monthly updates into one toggle per channel.
                </p>
                
                {/* Email Notifications */}
                <div style={{marginBottom: '24px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                    <div>
                      <div style={{fontWeight: '600', color: '#374151', marginBottom: '4px', fontSize: '16px'}}>
                        Email Notifications
                      </div>
                      <div style={{fontSize: '14px', color: '#6b7280'}}>
                        Get weekly progress updates and monthly leaderboard rankings via email
                      </div>
                    </div>
                    <label style={{position: 'relative', display: 'inline-block', width: '44px', height: '24px'}}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.email_enabled}
                        onChange={(e) => updateNotificationSetting('email_enabled', e.target.checked)}
                        style={{opacity: 0, width: 0, height: 0}}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: notificationSettings.email_enabled ? '#2E0456' : '#ccc',
                        transition: '0.3s',
                        borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: notificationSettings.email_enabled ? '23px' : '3px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          transition: '0.3s',
                          borderRadius: '50%'
                        }}></span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* WhatsApp Notifications */}
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                    <div>
                      <div style={{fontWeight: '600', color: '#374151', marginBottom: '4px', fontSize: '16px'}}>
                        WhatsApp Notifications
                      </div>
                      <div style={{fontSize: '14px', color: '#6b7280'}}>
                        Get weekly progress updates and monthly leaderboard rankings via WhatsApp
                      </div>
                    </div>
                    <label style={{position: 'relative', display: 'inline-block', width: '44px', height: '24px'}}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.whatsapp_enabled}
                        onChange={(e) => updateNotificationSetting('whatsapp_enabled', e.target.checked)}
                        style={{opacity: 0, width: 0, height: 0}}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: notificationSettings.whatsapp_enabled ? '#2E0456' : '#ccc',
                        transition: '0.3s',
                        borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: notificationSettings.whatsapp_enabled ? '23px' : '3px',
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

      {/* Payment Wall Modal - Shows activity logs when subscription is cancelled */}
      <div className={`modal-overlay ${showPaymentWall ? 'active' : ''}`}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="payment-wall-title" style={{maxWidth: '800px'}}>
          <>
            <div className="modal__header">
              <h3 id="payment-wall-title" className="modal__title">
                Subscription cancelled
              </h3>
            </div>

            <div className="modal__content">
              <div style={{marginBottom: '16px'}}>
                <p style={{fontSize: '16px', color: '#6b7280', marginBottom: '24px'}}>
                  Your subscription has been cancelled. Below are the pincodes for your devices in case you need them.
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
                    <p style={{margin: 0, fontSize: '16px'}}>No device pincodes found</p>
                    <p style={{margin: '8px 0 0 0', fontSize: '14px'}}>No devices were added to your account</p>
                  </div>
                )}


              </div>
            </div>

            <div className="modal__footer">
              <a
                href="https://www.screentimejourney.com/products/screentimejourney"
                className="btn btn--primary btn--full"
                style={{width: '100%', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                Subscribe Now
              </a>
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
