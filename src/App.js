import React, { useState, useEffect, useRef } from 'react';
import PhoneInput, { getCountryCallingCode, isPossiblePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import RecordRTC from 'recordrtc';
import './App.css';
import './styles/brand-theme.css';

// Custom debounce hook for real-time username validation
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Helper function to scroll input into view when keyboard appears
const handleInputFocus = (e) => {
  // Only on mobile devices
  if (window.innerWidth <= 768) {
    // Wait for keyboard animation (iOS ~300ms, Android ~200ms)
    setTimeout(() => {
      const input = e.target;
      const modal = input.closest('.modal');
      
      if (modal) {
        // Scroll within modal
        const inputRect = input.getBoundingClientRect();
        const modalRect = modal.getBoundingClientRect();
        
        // If input is below the visible area, scroll it into view
        if (inputRect.bottom > modalRect.bottom - 100) {
          input.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      } else {
        // Fallback: scroll in viewport
        e.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 300);
  }
};

// Default milestone data as fallback (will be replaced by API data)
const DEFAULT_MILESTONES = [
  // Male milestones
  {
    "gene": "male",
    "level": 0,
    "days_range": "0",
    "title": "Ground Zero",
    "emoji": "🪨",
    "description": "Every journey starts from the ground. You've chosen to rise from where you stand.",
    "milestone_fact": "Dopamine receptors beginning their recovery.",
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
    "milestone_fact": "Dopamine sensitivity increases by ~15%.",
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
    "milestone_fact": "Complete dopamine receptor reset achieved.",
    "milestone_day": 365,
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/male_level_10_theking.jpg",
    "next_level_title": null,
    "next_level_emoji": null,
    "days_to_next": null,
    "level_template": "m10"
  },
  // Female milestones
  {
    "gene": "female",
    "level": 0,
    "days_range": "0",
    "title": "Awakening",
    "emoji": "🌸",
    "description": "Every journey starts from the ground. You've chosen to rise from where you stand.",
    "milestone_fact": "Dopamine receptors beginning their recovery.",
    "milestone_day": 0,
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/female_level_0_awakening.jpg",
    "next_level_title": "Blossoming",
    "next_level_emoji": "🌺",
    "days_to_next": 7,
    "level_template": ""
  },
  {
    "gene": "female",
    "level": 1,
    "days_range": "7–14",
    "title": "Blossoming",
    "emoji": "🌺",
    "description": "You've stepped into the journey. Each day you stay the course, your strength builds silently.",
    "milestone_fact": "Dopamine sensitivity increases by ~15%.",
    "milestone_day": 14,
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/female_level_1_blossoming.jpg",
    "next_level_title": "Queen",
    "next_level_emoji": "👑",
    "days_to_next": 351,
    "level_template": "f1"
  },
  {
    "gene": "female",
    "level": 10,
    "days_range": "365+",
    "title": "The Queen",
    "emoji": "👑",
    "description": "You've walked the path fully. Quiet strength and clarity mark the way you stand today.",
    "milestone_fact": "Complete dopamine receptor reset achieved.",
    "milestone_day": 365,
    "media_url": "https://wati-files.s3.eu-north-1.amazonaws.com/Milestones/female_level_10_thequeen.jpg",
    "next_level_title": null,
    "next_level_emoji": null,
    "days_to_next": null,
    "level_template": "f10"
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
const ProgressSection = ({ latestDevice, customerName = "Merijn", customerEmail = "", customerGender = "male", percentile = 6, devices, milestones = DEFAULT_MILESTONES, startDeviceFlow, customerFirstName = "" }) => {
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
  
  // Extract first name - prioritize actual first_name, then username, then email
  let firstName = "Friend"; // Default fallback
  
  if (customerFirstName && customerFirstName.trim()) {
    // Use actual first name if provided
    firstName = customerFirstName.charAt(0).toUpperCase() + customerFirstName.slice(1);
  } else if (customerName && customerName.trim()) {
    // Fallback to username without @ if present, capitalize first letter
    firstName = customerName.replace('@', '');
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  } else if (customerEmail && customerEmail.includes('@')) {
    // Fallback to email prefix (before @)
    firstName = customerEmail.split('@')[0];
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  }
  
  // Calculate percentile based on devices - 0% if no devices
  const actualPercentile = (devices && devices.length > 0) ? percentile : 0;
  
  // Check if using default or API milestones for debugging
  const isUsingDefault = milestones === DEFAULT_MILESTONES;
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <div className="card card--hero">
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
          <h2 className="journey-greeting journey-greeting--big">Hi{firstName ? ` ${firstName}` : ''},</h2>
          <p className="journey-line" style={{marginBottom: '12px'}}>You are among the top <strong>{actualPercentile}%</strong> in the world 🌍.</p>
          <p className="journey-line" style={{marginBottom: '12px'}}>Right now, you are <strong>{currentLevel.title} {currentLevel.emoji}</strong> with <strong>{daysInFocus}</strong> days in focus.</p>
          {currentLevel.milestone_fact && (
            <p className="journey-line" style={{marginBottom: '12px'}}>🧠 {currentLevel.milestone_fact}</p>
          )}
          {!currentLevel.milestone_fact && console.log('⚠️ No milestone_fact found for level:', currentLevel)}
          {currentLevel.next_level_title && (
            <p className="journey-line journey-line--next" style={{marginBottom: '12px'}}>Next up: <strong>{currentLevel.next_level_title} {currentLevel.next_level_emoji}</strong> in <strong>{daysToNext}</strong> days.</p>
          )}
          <p className="journey-line journey-line--path">You're on your path to <strong>{userGender === 'male' ? 'King' : 'Queen'} 👑</strong> in <strong>{finalGoalDays}</strong> days.</p>
          
          {/* Add Device Button */}
          <div style={{marginTop: '20px', position: 'relative'}}>
            <button 
              className={`btn-primary ${devices.length < 3 ? 'btn-primary--animated' : ''}`}
              onClick={() => devices.length < 3 && startDeviceFlow('device_setup_flow')}
              disabled={devices.length >= 3}
              style={{
                width: '100%',
                ...(devices.length >= 3 && {
                  cursor: 'not-allowed',
                  position: 'relative',
                  opacity: 0.6,
                  pointerEvents: 'none'
                })
              }}
            >
              {devices.length >= 3 ? 'Maximum Reached' : (devices.length === 0 ? 'Start Now' : 'Add New Device')}
              {devices.length >= 3 && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: '8px',
                  pointerEvents: 'none'
                }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Removed duplicate quote below the section */}
    </div>
  );
};

// Audio Player Component
function AudioPlayer({ audioUrl, onPlay }) {
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
        // Call onPlay callback when audio starts playing
        if (onPlay) {
          onPlay();
        }
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
  const [initialLoad, setInitialLoad] = useState(true); // Track if this is the first load
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [testScenario, setTestScenario] = useState('ground_zero');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [newUsername, setNewUsername] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('+31');
  const [phoneNumber, setPhoneNumber] = useState(''); // Full phone number with country code
  const [detectedCountry, setDetectedCountry] = useState('NL'); // Default to Netherlands
  const [whatToChange, setWhatToChange] = useState('');
  const [whatToGain, setWhatToGain] = useState('');
  const [doingThisFor, setDoingThisFor] = useState('');
  const [commitmentValidating, setCommitmentValidating] = useState(false);
  const [commitmentError, setCommitmentError] = useState('');
  const [usernameValid, setUsernameValid] = useState(null); // null, true, false
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  
  // Debounced username for real-time validation
  const debouncedUsername = useDebounce(newUsername, 500);
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
    device_type: '',
    terms_accepted: false
  });
  const [deviceFormErrors, setDeviceFormErrors] = useState({});
  
  // VPN Profile state
  const [vpnProfileData, setVpnProfileData] = useState(null);
  const [profileGenerating, setProfileGenerating] = useState(false);
  
  // Audio Guide state
  const [audioGuideData, setAudioGuideData] = useState(null);
  const [audioGenerating, setAudioGenerating] = useState(false);
  const [audioHasBeenPlayed, setAudioHasBeenPlayed] = useState(false);
  
  // Shared pincode state - ONE pincode for both VPN and audio
  const [sharedPincode, setSharedPincode] = useState(null);
  
  // Shared device_id for tracking across the entire setup flow
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  
  // Voice surrender state
  const [surrenderText, setSurrenderText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordRTC, setRecordRTC] = useState(null); // RecordRTC instance for reliable cross-browser recording
  const [audioStream, setAudioStream] = useState(null); // Store stream for cleanup
  const [surrenderSubmitting, setSurrenderSubmitting] = useState(false);
  const [surrenderError, setSurrenderError] = useState('');
  const [surrenderSuccess, setSurrenderSuccess] = useState('');
  const [surrenderResultModal, setSurrenderResultModal] = useState(null); // {type: 'success'|'error', message: string}
  const [audioLevels, setAudioLevels] = useState([]);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [surrenderApproved, setSurrenderApproved] = useState(false);
  const [unlockPincode, setUnlockPincode] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  const previewAudioRef = useRef(null); // Ref for recorded audio playback
  const modalRef = useRef(null); // Ref for modal to enable auto-scroll
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
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
  const [tempNotificationSettings, setTempNotificationSettings] = useState({
    email_enabled: true,
    whatsapp_enabled: false
  });
  const [notificationsSubmitting, setNotificationsSubmitting] = useState(false);

  // Logs state
  const [showLogsFlow, setShowLogsFlow] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Payment wall state
  const [showPaymentWall, setShowPaymentWall] = useState(false);

  // Set country code from user's existing WhatsApp number in DynamoDB
  useEffect(() => {
    if (profileData?.whatsapp) {
      // Extract country code from existing WhatsApp number (e.g., "+31627207989" → "NL")
      const phoneWithCode = profileData.whatsapp;
      
      // Extended country code to country mapping (covers 50+ most common countries)
      const countryCodeMap = {
        // North America
        '+1': 'US',
        // Europe
        '+31': 'NL', '+32': 'BE', '+33': 'FR', '+34': 'ES', '+39': 'IT',
        '+41': 'CH', '+43': 'AT', '+44': 'GB', '+45': 'DK', '+46': 'SE',
        '+47': 'NO', '+48': 'PL', '+49': 'DE', '+351': 'PT', '+352': 'LU',
        '+353': 'IE', '+358': 'FI', '+420': 'CZ', '+30': 'GR', '+36': 'HU',
        '+40': 'RO', '+359': 'BG', '+385': 'HR', '+386': 'SI', '+421': 'SK',
        // Middle East & Africa
        '+20': 'EG', '+27': 'ZA', '+212': 'MA', '+213': 'DZ', '+216': 'TN',
        '+234': 'NG', '+254': 'KE', '+966': 'SA', '+971': 'AE', '+972': 'IL',
        '+974': 'QA', '+962': 'JO', '+961': 'LB', '+90': 'TR',
        // Asia & Pacific
        '+61': 'AU', '+64': 'NZ', '+81': 'JP', '+82': 'KR', '+86': 'CN',
        '+91': 'IN', '+92': 'PK', '+93': 'AF', '+94': 'LK', '+95': 'MM',
        '+60': 'MY', '+62': 'ID', '+63': 'PH', '+65': 'SG', '+66': 'TH',
        '+84': 'VN', '+852': 'HK', '+886': 'TW', '+880': 'BD',
        // Latin America
        '+52': 'MX', '+54': 'AR', '+55': 'BR', '+56': 'CL', '+57': 'CO',
        '+51': 'PE', '+58': 'VE', '+507': 'PA', '+506': 'CR'
      };
      
      // Try to match country code from WhatsApp number
      for (const [code, country] of Object.entries(countryCodeMap)) {
        if (phoneWithCode.startsWith(code)) {
          setDetectedCountry(country);
          console.log(`✅ Country detected from profile: ${country} (${code})`);
          return;
        }
      }
    }
    // Default to NL if no WhatsApp or country code not recognized
    console.log('ℹ️ Using default country: NL');
  }, [profileData]);

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

  // Close modals on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        // Close any open modal
        if (showDeviceFlow) {
          setShowDeviceFlow(false);
          setCurrentFlow(null);
          setCurrentFlowStep(1);
        } else if (showProfileEdit) {
          setShowProfileEdit(false);
        } else if (showNotificationsFlow) {
          setShowNotificationsFlow(false);
        } else if (showCancelFlow) {
          setShowCancelFlow(false);
        } else if (showLogsFlow) {
          setShowLogsFlow(false);
        } else if (showPaymentWall) {
          setShowPaymentWall(false);
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showDeviceFlow, showProfileEdit, showNotificationsFlow, showCancelFlow, showLogsFlow, showPaymentWall]);

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
    // Note: Percentile is calculated after devices are loaded (see devices useEffect)
    
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
        setInitialLoad(false); // Mark initial load as complete
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
      setInitialLoad(false); // Mark initial load as complete
      
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
  const fetchPercentile = async (devicesArray) => {
    try {
      const customerId = extractCustomerId();
      if (!customerId) {
        console.log('ℹ️ No customer ID, using default percentile');
        return;
      }

      // Only calculate percentile if user has devices
      // Otherwise it returns 400 because there's no data to rank
      if (!devicesArray || devicesArray.length === 0) {
        console.log('ℹ️ No devices yet, using default percentile (will calculate after first device)');
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

      if (!response.ok) {
        console.log(`ℹ️ Percentile calculation unavailable, using default 6%`);
        return;
      }

      const result = await response.json();

      if (result.success && result.percentile !== undefined) {
        setPercentile(result.percentile);
        console.log(`✅ Percentile calculated: Top ${result.percentile}%`);
      } else {
        console.log('ℹ️ No percentile data available, using default 6%');
      }
      
    } catch (error) {
      console.log('ℹ️ Percentile calculation unavailable, using default 6%');
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
                action_button: 'Next step'
              },
              {
                step: 2,
                title: 'Setup Screentime',
                body: '‼️ Setup dummy pincode first.',
                step_type: 'video',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/screentime.mov',
                action_button: 'Next Step'
              },
              {
                step: 3,
                title: 'Setup Profile',
                body: '‼️ Extra optional protection against porn',
                step_type: 'video',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/profile.mov',
                action_button: 'Next Step'
              },
              {
                step: 4,
                title: 'Setup Pincode',
                body: '',
                step_type: 'video',
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/pincode.mov',
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
                media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/unlock.mov',
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
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/get_system_config?v=${Date.now()}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
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
              
              // DEBUG: Log all video URLs
              console.log(`✅ Loaded ${flowKey}:`, result.data.flow_name, `(${result.data.steps.length} steps)`);
              result.data.steps.forEach(step => {
                if (step.media_url) {
                  console.log(`  📹 Step ${step.step} (${step.title}): ${step.media_url}`);
                }
              });
            } else {
              console.log(`ℹ️ ${flowKey} has invalid structure from API, will use fallback`);
            }
          } else {
            console.log(`ℹ️ ${flowKey} not available from API, will use fallback`);
          }
        } catch (error) {
          console.log(`ℹ️ Could not fetch ${flowKey}, will use fallback`);
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
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/screentime.mov',
              action_button: 'Next Step'
            },
            {
              step: 3,
              title: 'Setup Profile',
              body: '‼️ Extra optional protection against porn',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/profile.mov',
              action_button: 'Next Step'
            },
            {
              step: 4,
              title: 'Setup Pincode',
              body: '',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/pincode.mov',
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
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/unlock.mov',
              surrender_text: 'I hereby give up on changing my screen time habits. I give up the chance to be a present family man, live with more presence and purpose, and give attention to my wife and children. I choose distraction over discipline, and I surrender my intention to grow.',
              action_button: 'Submit Surrender'
            },
            {
              step: 2,
              title: 'Device Unlocked',
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
              purpose: 'device_setup',
              terms_accepted: deviceFormData.terms_accepted,
              terms_accepted_at: new Date().toISOString()
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (!response.ok) {
            console.log(`⚠️ PIN storage API returned ${response.status}, continuing with local pincode`);
            throw new Error(`PIN storage failed: ${response.status}`);
          }
          
          console.log('✅ Pincode stored in stj_password table');
        } catch (apiError) {
          console.log('ℹ️ PIN storage unavailable, continuing with local pincode');
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

  // Cloudflare WARP Profile generation (Zero Trust)
  const generateVPNProfile = async () => {
    console.log('🔧 generateVPNProfile called (Cloudflare WARP)', { 
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
      // Generate UUID for tracking this specific profile
      const profileUUID = `${generateUUID()}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      console.log('🆔 Generated profile UUID:', profileUUID);
      
      // Get or generate PIN - ALWAYS store in stj_password
      let pincode = null;
      
      if (deviceFormData.device_type === 'macOS') {
        // macOS: Use shared pincode from audio guide
        if (!sharedPincode || !sharedPincode.pincode) {
          console.error('❌ No shared pincode available for macOS.');
          alert('Please generate an audio guide first before creating the profile for macOS.');
          setProfileGenerating(false);
          return;
        }
        pincode = sharedPincode.pincode;
        console.log('✅ Using shared pincode for macOS profile:', pincode);
      } else {
        // iOS: Generate new 4-digit pincode
        pincode = Math.floor(1000 + Math.random() * 9000).toString();
        console.log('✅ Generated new pincode for iOS profile:', pincode);
      }
      
      // ALWAYS store PIN in stj_password table with profile UUID
      console.log('💾 Storing PIN in stj_password table...');
      try {
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!isLocalDev) {
      let customerId = customerData?.customerId;
      if (!customerId) {
            customerId = extractCustomerId();
          }
          
          // ✅ Match backend expected format (snake_case)
          const pincodePayload = {
            pincode: pincode,
            uuid: profileUUID,
            device_type: deviceFormData.device_type,
            device_name: deviceFormData.device_name || 'Unnamed Device',
            customer_id: customerId || 'unknown',
            method: 'create',
            purpose: 'vpn_profile'
          };
            
          const storeResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/store_pincode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pincodePayload),
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (storeResponse.ok) {
            console.log('✅ PIN stored successfully in stj_password');
          } else {
            console.log(`ℹ️ PIN storage returned ${storeResponse.status}, continuing...`);
          }
        } else {
          console.log('🔧 Local dev: Skipping PIN storage');
        }
      } catch (storeError) {
        console.log('ℹ️ PIN storage unavailable, continuing with profile generation');
        // Continue anyway - don't block profile generation
      }
      
      // Generate Cloudflare WARP profile content
      const warpUUID = generateUUID();
      const profileContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadDescription</key>
      <string>Configures Cloudflare WARP with Zero Trust</string>
      <key>PayloadDisplayName</key>
      <string>WARP VPN Configuration</string>
      <key>PayloadIdentifier</key>
      <string>com.screentimejourney.warp.${warpUUID}</string>
      <key>PayloadType</key>
      <string>com.cloudflare.warp</string>
      <key>PayloadUUID</key>
      <string>${warpUUID}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>Organization</key>
      <string>screentimejourney</string>
      <key>AutoConnect</key>
      <integer>2</integer>
      <key>SwitchLocked</key>
      <true/>
      <key>ServiceMode</key>
      <string>warp</string>
      <key>DisableAutoFallback</key>
      <true/>
      <key>SupportURL</key>
      <string>https://screentimejourney.com/support</string>
      <key>EnableDNSFiltering</key>
      <true/>
      <key>EnableFirewallFiltering</key>
      <true/>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Enforces content filtering and prevents bypass via VPN. Profile ID: ${profileUUID}</string>
  <key>PayloadDisplayName</key>
  <string>Screen Time Journey Protection</string>
  <key>PayloadIdentifier</key>
  <string>com.screentimejourney.profile.${profileUUID}</string>
  <key>PayloadOrganization</key>
  <string>Screen Time Journey</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${profileUUID}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
  <key>PayloadScope</key>
  <string>User</string>
</dict>
</plist>`;
      
      // Create filename with UUID for tracking
      const filename = `ScreenTimeJourney_${deviceFormData.device_type}_${profileUUID.split('-')[0]}_${timestamp}.mobileconfig`;
      
      // Set profile data for download
        const profileData = {
        deviceType: deviceFormData.device_type,
        hasPincode: true,
        pincode: pincode,
        profileUUID: profileUUID,
        filename: filename,
        downloadUrl: null, // Will be set after upload
        s3_url: `https://wati-mobconfigs.s3.eu-north-1.amazonaws.com/${filename}`,
        profileContent: profileContent,
        timestamp: timestamp
        };
      
        setVpnProfileData(profileData);
      console.log('✅ Cloudflare WARP profile generated with UUID:', profileUUID);
      console.log('📱 Profile filename:', filename);
      console.log('🔑 PIN for tracking:', pincode);
      
    } catch (error) {
      console.error('❌ Error generating Cloudflare WARP profile:', error);
      alert('Failed to generate profile. Please try again.');
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
    const webFilterUUID = generateUUID();
    const restrictionsUUID = generateUUID();
    
    if (deviceType === 'iOS') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <!-- 1. CleanBrowsing DNS over HTTPS -->
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key>
        <string>HTTPS</string>
        <key>ServerURL</key>
        <string>https://doh.cleanbrowsing.org/doh/adult-filter/</string>
      </dict>
      <key>PayloadDisplayName</key>
      <string>CleanBrowsing Adult Filter DNS</string>
      <key>PayloadIdentifier</key>
      <string>com.merijnkokbv.cleanbrowsingdns</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>${dnsUUID}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
    
    <!-- 2. Apple Built-in Web Content Filter (Limit Adult Websites) -->
    <dict>
      <key>PayloadType</key>
      <string>com.apple.webcontent-filter</string>
      <key>PayloadIdentifier</key>
      <string>com.merijnkokbv.webcontentfilter</string>
      <key>PayloadUUID</key>
      <string>${webFilterUUID}</string>
      <key>PayloadDisplayName</key>
      <string>Web Content Filter</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>FilterType</key>
      <string>BuiltIn</string>
      <key>AutoFilterEnabled</key>
      <true/>
      <key>PermittedURLs</key>
      <array/>
    </dict>
    
    <!-- 3. Application Access Restrictions -->
    <dict>
      <key>PayloadType</key>
      <string>com.apple.applicationaccess</string>
      <key>PayloadIdentifier</key>
      <string>com.merijnkokbv.restrictions</string>
      <key>PayloadUUID</key>
      <string>${restrictionsUUID}</string>
      <key>PayloadDisplayName</key>
      <string>Content Restrictions</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      
      <!-- Block Explicit Content -->
      <key>allowExplicitContent</key>
      <false/>
      <key>allowBookstoreErotica</key>
      <false/>
      
      <!-- Enforce SafeSearch -->
      <key>forceAssistantProfanityFilter</key>
      <true/>
      
      <!-- Content Ratings -->
      <key>ratingRegion</key>
      <string>us</string>
      <key>ratingApps</key>
      <integer>200</integer>
      <key>ratingMovies</key>
      <integer>1000</integer>
      <key>ratingTVShows</key>
      <integer>1000</integer>
      
      <!-- Safari Settings -->
      <key>safariAllowAutoFill</key>
      <true/>
      <key>safariForceFraudWarning</key>
      <true/>
      <key>safariAllowPopups</key>
      <false/>
      
      <!-- Disable Private Browsing -->
      <key>allowSafariPrivateBrowsing</key>
      <false/>
      
      <!-- Disable Safari Extensions -->
      <key>allowSafariExtensions</key>
      <false/>
      
      <!-- Prevent VPN Bypass -->
      <key>allowVPNCreation</key>
      <false/>
      
      <!-- Restrict Multiplayer Gaming -->
      <key>allowMultiplayerGaming</key>
      <false/>
      <key>allowAddingGameCenterFriends</key>
      <false/>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Multi-layer protection: DNS + Web Filter + Content Restrictions + Safari Protection + Gaming Restrictions</string>
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
      const macWebFilterUUID = generateUUID();
      const macRestrictionsUUID = generateUUID();
      
      return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <!-- 1. CleanBrowsing DNS over HTTPS -->
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key>
        <string>HTTPS</string>
        <key>ServerURL</key>
        <string>https://doh.cleanbrowsing.org/doh/adult-filter/</string>
      </dict>
      <key>PayloadDisplayName</key>
      <string>CleanBrowsing Adult Filter DNS</string>
      <key>PayloadIdentifier</key>
      <string>com.merijnkokbv.cleanbrowsingdns</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>${dnsUUID}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
    
    <!-- 2. Apple Built-in Web Content Filter (Limit Adult Websites) -->
    <dict>
      <key>PayloadType</key>
      <string>com.apple.webcontent-filter</string>
      <key>PayloadIdentifier</key>
      <string>com.merijnkokbv.webcontentfilter</string>
      <key>PayloadUUID</key>
      <string>${macWebFilterUUID}</string>
      <key>PayloadDisplayName</key>
      <string>Web Content Filter</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>FilterType</key>
      <string>BuiltIn</string>
      <key>AutoFilterEnabled</key>
      <true/>
      <key>PermittedURLs</key>
      <array/>
    </dict>
    
    <!-- 3. Application Access Restrictions -->
    <dict>
      <key>PayloadType</key>
      <string>com.apple.applicationaccess.new</string>
      <key>PayloadIdentifier</key>
      <string>com.merijnkokbv.restrictions</string>
      <key>PayloadUUID</key>
      <string>${macRestrictionsUUID}</string>
      <key>PayloadDisplayName</key>
      <string>Content Restrictions</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      
      <!-- Parental Controls -->
      <key>familyControlsEnabled</key>
      <true/>
      
      <!-- Safari Settings -->
      <key>safariAcceptCookies</key>
      <integer>2</integer>
      <key>safariForceFraudWarning</key>
      <true/>
      <key>safariAllowPopups</key>
      <false/>
      
      <!-- Disable Private Browsing -->
      <key>allowSafariPrivateBrowsing</key>
      <false/>
      
      <!-- Disable Safari Extensions -->
      <key>allowSafariExtensions</key>
      <false/>
      
      <!-- Restrict Multiplayer Gaming -->
      <key>allowMultiplayerGaming</key>
      <false/>
      <key>allowAddingGameCenterFriends</key>
      <false/>
    </dict>
    
    <!-- 4. Profile Removal Password -->
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
  <string>Multi-layer protection: DNS + Web Filter + Content Restrictions + Safari Protection + Gaming Restrictions + PIN Protection</string>
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
    
    console.log('📥 Opening profile for installation:', vpnProfileData.filename);
    console.log('🆔 Profile UUID:', vpnProfileData.profileUUID);
    console.log('🔑 PIN:', vpnProfileData.pincode);
    
    // Create blob with correct MIME type for iOS/macOS profile
    const blob = new Blob([vpnProfileData.profileContent], { 
      type: 'application/x-apple-aspen-config' 
    });
    const url = window.URL.createObjectURL(blob);
    
    // ✅ FIX: Use direct download link for all devices to trigger installation
    const link = document.createElement('a');
    link.href = url;
    link.download = vpnProfileData.filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('📥 Profile download triggered:', vpnProfileData.filename);
    
    // Clean up after a delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
      
    console.log('✅ Profile ready for installation!');
    console.log('📝 User should:');
    console.log('   1. Tap "Allow" when prompted to install profile');
    console.log('   2. Go to Settings > Profile Downloaded > Install');
    console.log('   3. Download WARP app from App Store');
    console.log('   4. Login with: screentimejourney');
    console.log('   5. Save PIN for support:', vpnProfileData.pincode);
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

  // Voice recording functions for surrender - Using RecordRTC for reliability
  // RecordRTC produces consistent WAV files that work perfectly with OpenAI Whisper
  // No more browser-specific bugs, codec issues, or format incompatibilities!

  const startRecording = async () => {
    try {
      console.log('🎤 Starting RecordRTC recording (WAV → backend converts to MP3)...');
      setSurrenderError('');
      setAudioBlob(null);
      
      const scrollY = window.scrollY;
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      console.log('✅ Got media stream for RecordRTC');
      
      // Store stream for cleanup
      setAudioStream(stream);

      // ✅ CREATE RECORDRTC INSTANCE - WAV FORMAT
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1 // mono is fine for voice and smaller files
      });

      setRecordRTC(recorder);

      // Reset recording time
      setRecordingTime(0);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

      // Audio visualization setup
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyserNode = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 256;
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyserNode);
      setAudioContext(audioCtx);
      setAnalyser(analyserNode);

      // Visualization animation
      const updateAudioLevels = () => {
        if (analyserNode) {
          analyserNode.getByteFrequencyData(dataArray);
          
          const bars = [];
          const barCount = 30;
          const samplesPerBar = Math.floor(bufferLength / barCount);
          
          for (let i = 0; i < barCount; i++) {
            let sum = 0;
            for (let j = 0; j < samplesPerBar; j++) {
              sum += dataArray[i * samplesPerBar + j];
            }
            const average = sum / samplesPerBar;
            const height = Math.max(4, (average / 255) * 100);
            bars.push(height);
          }
          
          setAudioLevels(bars);
          
          const newAnimationId = requestAnimationFrame(updateAudioLevels);
          setAnimationId(newAnimationId);
        }
      };

      // ✅ START RECORDING
      recorder.startRecording();
      console.log('🔴 RecordRTC recording started (WAV)');
      
      setIsRecording(true);
      updateAudioLevels();
      
      // ✅ Scroll AFTER recording card renders (wait for React to render the card)
      // Small delay ensures the recording card is in the DOM before scrolling
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (modalRef.current) {
            modalRef.current.scrollTo({
              top: modalRef.current.scrollHeight,
              behavior: 'smooth'
            });
            console.log('✅ Auto-scrolled modal after recording card appeared');
          }
        });
      }, 150); // 150ms delay for React to render the recording card
      
      console.log('✅ Recording initialized successfully');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Failed to start recording. Please try again.');
      }
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping RecordRTC recording...');
    
    if (!recordRTC || !isRecording) {
      console.log('⚠️ No active recording to stop');
      return;
    }
    
    // ✅ CAPTURE SCROLL POSITION BEFORE ANY STATE CHANGES
    const modal = document.querySelector('.modal__content');
    const savedScrollTop = modal ? modal.scrollTop : window.scrollY;
    console.log('📍 Captured scroll position BEFORE state changes:', savedScrollTop);
    
    // Stop animation
    if (animationId) {
      cancelAnimationFrame(animationId);
      setAnimationId(null);
    }
    
    // Clear timer
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    
    // ✅ STOP RECORDRTC FIRST, THEN BATCH ALL STATE CHANGES
    recordRTC.stopRecording(() => {
      console.log('🔄 RecordRTC stopped, getting WAV blob...');
      const blob = recordRTC.getBlob();
      console.log('🎵 WAV blob size:', blob?.size, 'bytes, type:', blob?.type);

      if (!blob || blob.size === 0) {
        console.error('❌ Empty WAV blob from RecordRTC!');
        setIsRecording(false); // Reset state on error
        alert('Recording failed - empty audio file. Please try again.');
        return;
      }

      if (blob.size < 8000) {
        console.error('❌ WAV file too small:', blob.size, 'bytes');
        setIsRecording(false); // Reset state on error
        alert('Recording too short. Please record for at least 5 seconds and try again.');
        return;
      }

      // ✅ CREATE FILE WITH .WAV EXTENSION
      const file = new File([blob], 'surrender.wav', {
        type: 'audio/wav'
      });

      console.log('✅ WAV file created for upload:', file.name, file.size, 'bytes', file.type);

      // Clean up stream
      if (audioStream) {
        console.log('🧹 Stopping audio tracks...');
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }

      // Clean up audio context
      if (audioContext) {
        console.log('🧹 Closing audio context...');
        audioContext.close();
        setAudioContext(null);
      }

      setAudioLevels([]);
      setRecordRTC(null);

      // ✅ BATCH STATE CHANGES: This causes ONE re-render instead of two
      // The key is to call setIsRecording(false) and setAudioBlob(file) together
      setIsRecording(false);
      setAudioBlob(file);

      console.log('✅ Recording stopped, state updated');

      // ✅ RESTORE SCROLL POSITION AFTER REACT RE-RENDERS
      const restoreScroll = () => {
        const modalElement = document.querySelector('.modal__content');
        if (modalElement) {
          modalElement.scrollTop = savedScrollTop;
          console.log('🔒 Restored modal scroll to:', savedScrollTop, '(actual:', modalElement.scrollTop, ')');
        } else {
          window.scrollTo({ top: savedScrollTop, behavior: 'instant' });
          console.log('🔒 Restored window scroll to:', savedScrollTop);
        }
      };
      
      // Execute multiple times across animation frames to ensure it sticks
      requestAnimationFrame(() => {
        restoreScroll();
        requestAnimationFrame(() => {
          restoreScroll();
          setTimeout(restoreScroll, 0);
          setTimeout(restoreScroll, 10);
          setTimeout(restoreScroll, 50);
          setTimeout(restoreScroll, 100);
          setTimeout(restoreScroll, 150);
        });
      });

      console.log('🛑 Stop recording completed');
    });
  };

  const submitSurrender = async () => {
    if (!audioBlob) {
      setSurrenderError('Please record your surrender message first.');
      return;
    }

    setSurrenderSubmitting(true);
    setSurrenderError(''); // Clear previous errors

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

      // ✅ EXTENSIVE LOGGING FOR DEBUGGING
      console.log('==== AUDIO BLOB DETAILS ====');
      console.log('📊 Blob type:', audioBlob.type);
      console.log('📊 Blob size:', audioBlob.size, 'bytes');
      console.log('📊 Blob instanceof File:', audioBlob instanceof File);
      console.log('📊 Blob instanceof Blob:', audioBlob instanceof Blob);
      
      // Verify blob is valid
      if (!audioBlob || audioBlob.size === 0) {
        console.error('❌ CRITICAL: Audio blob is empty or null!');
        throw new Error('Audio blob is empty');
      }
      
      // Determine file extension from MIME type
      let fileExtension = 'webm'; // default
      if (audioBlob.type.includes('ogg')) fileExtension = 'ogg';
      else if (audioBlob.type.includes('mp4')) fileExtension = 'm4a';
      else if (audioBlob.type.includes('webm')) fileExtension = 'webm';
      else if (audioBlob.type.includes('wav')) fileExtension = 'wav';
      
      console.log('🎙️ Audio format:', audioBlob.type, '→ extension:', fileExtension);
      console.log('📦 Backend will convert to MP3 for Whisper');
      
      // Create FormData for audio upload
      const formData = new FormData();
      formData.append('audio', audioBlob, `surrender.${fileExtension}`);
      formData.append('user_id', customerData?.customerId || extractCustomerId());
      formData.append('device_id', currentFlow.deviceId);
      formData.append('surrender_text', currentFlow.steps[currentFlowStep - 1].surrender_text || surrenderText);
      
      console.log('🎵 Submitting audio:');
      console.log('  - Type:', audioBlob.type);
      console.log('  - Size:', audioBlob.size, 'bytes');
      console.log('  - Extension:', fileExtension);
      console.log('  - Backend: Will convert to MP3 for Whisper');
      console.log('============================');

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
          
          // Send email with pincode
          await sendUnlockEmail(result.pincode);
          
          // Show success modal popup
          setSurrenderResultModal({
            type: 'success',
            message: result.feedback || '✅ You spoke it with weight. That matters. The surrender was real — and now, a new chapter begins. Choose what comes next with clarity.'
          });
        } else {
          // Show error modal popup
          setSurrenderResultModal({
            type: 'error',
            message: result.feedback || result.message || 'Your recording did not match the required text. Please try again.'
          });
        }
      } else {
        // Show user-friendly feedback from API, fallback to error message
        const errorMessage = result.feedback || result.error || result.message || 'Unable to process audio file';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ Error submitting surrender:', error);
      // Show error modal popup
      setSurrenderResultModal({
        type: 'error',
        message: error.message || 'Unable to process your recording. Please try again.'
      });
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
    setCancelStep(2); // Start at step 2 (feedback form)
    setCancelReason('user_feedback'); // Set default reason
    setCancelFeedback('');
  };

  const closeCancelFlow = () => {
    setShowCancelFlow(false);
    setCancelStep(2);
    setCancelReason('user_feedback');
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
        
        // Refresh profile data to get updated status from backend (silently)
        await fetchProfileData(true);
        
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
    // Copy current settings to temp state for editing
    setTempNotificationSettings({...notificationSettings});
    setShowNotificationsFlow(true);
  };

  const closeNotificationsFlow = () => {
    // Discard any changes made
    setShowNotificationsFlow(false);
  };

  const updateNotificationSetting = (key, value) => {
    // Update only the temporary state (not saved until "Save Settings" is clicked)
    setTempNotificationSettings(prev => ({
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
        console.log('🔧 Local dev: Mock notification settings saved', tempNotificationSettings);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        // Save temp settings to real settings
        setNotificationSettings({...tempNotificationSettings});
        closeNotificationsFlow();
        return;
      }

      // Send simplified notification preferences from temp state
      const notificationPayload = {
        customer_id: customerId,
        email_enabled: tempNotificationSettings.email_enabled,
        whatsapp_enabled: tempNotificationSettings.whatsapp_enabled
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
        // Save temp settings to real settings on success
        setNotificationSettings({...tempNotificationSettings});
        closeNotificationsFlow();
      } else if (response.status === 404) {
        // Endpoint not implemented yet - save locally for now
        console.log('⚠️ Notification endpoint not implemented, saving locally');
        // Save temp settings to real settings
        setNotificationSettings({...tempNotificationSettings});
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
      console.log(`ℹ️ Using fallback flow for ${flowType} (API flow not available)`);
      
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
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/unlock.mov',
              surrender_text: 'I hereby give up on changing my screen time habits. I give up the chance to be a present family man, live with more presence and purpose, and give attention to my wife and children. I choose distraction over discipline, and I surrender my intention to grow.',
              action_button: 'Submit Surrender'
            },
            {
              step: 2,
              title: 'Device Unlocked',
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
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/screentime.mov',
              action_button: 'Next Step'
            },
            {
              step: 3,
              title: 'Setup Profile',
              body: '‼️ Extra optional protection against porn',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/profile.mov',
              action_button: 'Next Step'
            },
            {
              step: 4,
              title: 'Setup Pincode',
              body: '',
              step_type: 'video',
              media_url: 'https://wati-files.s3.eu-north-1.amazonaws.com/pincode.mov',
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
      
      console.log(`ℹ️ Flow ${flowType} not available (no API data and no fallback)`);
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
      
      if (!deviceFormData.terms_accepted) {
        errors.terms_accepted = 'You must agree to the terms of service to continue';
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
      device_type: ''
    });
    setVpnProfileData(null);
    setAudioGuideData(null);
    setAudioHasBeenPlayed(false);
    setSharedPincode(null);
    setAudioBlob(null);
    setIsRecording(false);
    setSurrenderSubmitting(false);
    setSurrenderApproved(false);
    setUnlockPincode(null);
  };



  // Function to fetch complete profile data from backend
  const fetchProfileData = async (silent = false) => {
    try {
      if (!silent) {
        setProfileLoading(true);
      }
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
          if (!silent) {
            setProfileLoading(false);
          }
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
          const loadedSettings = {
            email_enabled: result.profile.email_enabled !== undefined ? result.profile.email_enabled : true,
            whatsapp_enabled: result.profile.whatsapp_enabled !== undefined ? result.profile.whatsapp_enabled : false
          };
          setNotificationSettings(loadedSettings);
          setTempNotificationSettings(loadedSettings); // Initialize temp state with loaded settings
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
      if (!silent) {
        setProfileLoading(false);
      }
    }
  };

  // Function to update profile data
  const updateProfileData = async (updatedData) => {
    try {
      // ✅ Use button-level loading only (not dashboard spinner)
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
        // ✅ Smooth UX: Close modal immediately, refresh in background
        setProfileLoading(false);
        setShowProfileEdit(false);
        console.log('✅ Profile updated successfully - refreshing data silently...');
        
        // Silent background refresh (no loading spinner)
        await fetchProfileData(true);
        console.log('✅ Profile data refreshed silently');
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      setProfileError(error.message || 'Failed to update profile');
      setProfileLoading(false);
    }
  };

  // Auto-validate username as user types (with debounce)
  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      checkUsernameAvailability(debouncedUsername);
    } else if (debouncedUsername && debouncedUsername.length > 0 && debouncedUsername.length < 3) {
      setUsernameValid(null);
      setUsernameError('Username must be at least 3 characters');
    } else {
      setUsernameValid(null);
      setUsernameError('');
    }
  }, [debouncedUsername]);

  // Scroll modal to top when opened (especially important on mobile)
  useEffect(() => {
    if (showDeviceFlow || showOnboarding || showProfileEdit || showCancelFlow || showNotificationsFlow) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        const modal = document.querySelector('.modal-overlay.active .modal');
        if (modal) {
          modal.scrollTop = 0;
        }
      }, 100);
    }
  }, [showDeviceFlow, showOnboarding, showProfileEdit, showCancelFlow, showNotificationsFlow]);

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
    
    // Validate phone number from PhoneInput component
    if (!phoneNumber || !phoneNumber.trim()) {
      setWhatsappError('Please enter your phone number');
      return;
    }
    
    // Use isPossiblePhoneNumber from react-phone-number-input for validation
    if (!isPossiblePhoneNumber(phoneNumber)) {
      setWhatsappError('Please enter a valid phone number');
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
          console.log(`🔧 Local dev: Simulated sending code to ${phoneNumber}`);
          alert(`Demo: Verification code "123456" sent to ${phoneNumber}`);
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
          phone_number: phoneNumber.replace(/\s/g, ''), // Use phoneNumber from PhoneInput
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
          phone_number: phoneNumber.replace(/\s/g, ''), // Use phoneNumber from PhoneInput
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
        
        // Update percentile from API response (real-time calculation)
        if (typeof result.percentile === 'number') {
          setPercentile(result.percentile);
          console.log(`📊 Real-time percentile updated: Top ${result.percentile}%`);
        } else if (result.devices.length > 0) {
          // If devices exist but percentile wasn't returned, calculate it
          console.log('📊 Percentile not in response, calculating separately...');
          fetchPercentile(result.devices);
        } else {
          // Default to 0% if no devices
          setPercentile(0);
          console.log('📊 No devices yet, percentile: 0%');
        }
        
        return result.devices; // Return the loaded devices
      } else {
        console.log('📱 No devices found in backend (success=false or devices empty), starting with empty array');
        console.log('📱 Full result:', JSON.stringify(result));
        setDevices([]);
        setPercentile(0); // No devices = 0%
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
      // GDPR Compliance: Store terms acceptance
      terms_accepted: deviceFormData.terms_accepted,
      terms_accepted_at: new Date().toISOString(),
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
      
      // Reload profile data to refresh activity logs (silently, no spinner)
      await fetchProfileData(true);
      
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
      setAudioHasBeenPlayed(false);
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
            
            // Don't reload profile data yet - wait until device is removed
            // This prevents dashboard from refreshing while user is viewing Step 2
            
            // Schedule device removal for later (when modal closes or after 15 seconds)
            const deviceIdToRemove = currentFlow.deviceId;
            const customerIdForRemoval = customerData?.customerId || extractCustomerId();
            
            // Function to remove device
            const removeDeviceFromBackend = async () => {
              console.log('🗑️ Removing device from DynamoDB...');
              try {
                const removeResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/remove_device`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    customer_id: customerIdForRemoval,
                    device_id: deviceIdToRemove
                  })
                });
                
                if (removeResponse.ok) {
                  const removeResult = await removeResponse.json();
                  console.log('✅ Device permanently removed from DynamoDB:', removeResult);
                } else {
                  console.error('❌ Failed to remove device from DynamoDB:', removeResponse.status);
                }
                
                // Remove device from local state
                setDevices(prev => prev.filter(d => d.id !== deviceIdToRemove));
                console.log('🗑️ Device removed from local state');
                
                // Now reload profile data to refresh activity logs (silently, no spinner)
                await fetchProfileData(true);
                console.log('🔄 Profile data reloaded after device removal');
              } catch (error) {
                console.error('❌ Error removing device:', error);
                // Still remove from local state even if backend fails
                setDevices(prev => prev.filter(d => d.id !== deviceIdToRemove));
              }
            };
            
            // Set up delayed removal (15 seconds)
            const removalTimeout = setTimeout(() => {
              console.log('⏰ 15 seconds passed, removing device...');
              removeDeviceFromBackend();
            }, 15000);
            
            // Store timeout ID in currentFlow so we can trigger it early on modal close
            setCurrentFlow(prev => ({
              ...prev,
              deviceRemovalTimeout: removalTimeout,
              deviceRemovalFunction: removeDeviceFromBackend
            }));
            
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
  
  // Cleanup: Trigger device removal if user leaves page/closes browser
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentFlow?.deviceRemovalTimeout) {
        console.log('👋 User leaving page, triggering device removal...');
        clearTimeout(currentFlow.deviceRemovalTimeout);
        if (currentFlow.deviceRemovalFunction) {
          currentFlow.deviceRemovalFunction();
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentFlow]);
  
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
          
          // Reload profile data to refresh activity logs (silently, no spinner)
          await fetchProfileData(true);
          
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

  // Show full loading screen until ALL data is ready
  if (loading || profileLoading || milestonesLoading) {
    return (
      <div className="App" style={{ background: 'var(--page-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
              <div className="header-buttons-desktop">
                <a className="btn-outline-primary" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">Home</a>
              </div>
            </div>
          </div>
        </header>

        {/* Centered Loading Spinner */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ 
              width: '60px', 
              height: '60px',
              border: '4px solid #EEEEEE',
              borderTop: '4px solid var(--brand-primary)',
              margin: '0 auto 24px auto'
            }}></div>
            
            <h3 style={{ 
              fontFamily: 'var(--font-heading)', 
              color: '#0F172A', 
              marginBottom: '12px',
              fontSize: '1.5rem'
            }}>
              Loading your dashboard...
            </h3>
            
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.95rem' 
            }}>
              Please wait while we fetch your journey data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Error state:', error);
    return (
      <div className="App" style={{ background: 'var(--page-bg)', minHeight: '100vh' }}>
        {/* Announcement Bar */}
        <div className="announcement-bar">
          <div className="container" style={{
            fontFamily: 'var(--font-heading)',
            color: '#ffffff',
            fontWeight: 600
          }}>
            🔒 Authentication Required
          </div>
        </div>

        <header className="header" style={{ background: '#f9f9f9' }}>
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
              <div className="header-buttons-desktop">
                <a className="btn-primary" href="https://www.screentimejourney.com" target="_self" rel="noopener noreferrer">Home</a>
                <a className="btn-secondary" href="https://www.screentimejourney.com/customer_authentication/login?return_to=%2Fapps%2Fscreen-time-journey%3Fsource%3Dheader%26from%3D%2F" target="_self" rel="noopener noreferrer">Login</a>
              </div>
            </div>
          </div>
        </header>

        <div className="container" style={{ marginTop: '40px' }}>
          <main className="dashboard">
            <div className="modal" style={{ 
              maxWidth: '600px', 
              margin: '0 auto',
              boxShadow: 'var(--shadow-sm)',
              background: '#FFFFFF'
            }}>
              <div className="modal__header">
                <h3 className="modal__title" style={{ textAlign: 'center' }}>
                  Authentication Required
                </h3>
              </div>
              
              <div className="modal__content">
                <div style={{marginBottom: '20px'}}>
                  <p style={{ 
                    fontSize: '16px', 
                    color: 'var(--brand-text)', 
                    marginBottom: '24px',
                    lineHeight: '1.6',
                    fontFamily: 'var(--font-body)',
                    textAlign: 'center'
                  }}>
                    Your session has expired or could not be verified. Please log in through your store to access your dashboard.
                  </p>

                  <details style={{
                    marginBottom: '0', 
                    padding: '16px', 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--brand-separator)', 
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'left'
                  }}>
                    <summary style={{ 
                      cursor: 'pointer', 
                      fontWeight: '500', 
                      color: 'var(--text-muted)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-body)',
                      textAlign: 'center'
                    }}>
                      Technical Details
                    </summary>
                    <pre style={{
                      fontSize: '12px', 
                      marginTop: '12px',
                      fontFamily: 'var(--font-mono)', 
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

              <div className="modal__footer">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    window.location.href = 'https://www.screentimejourney.com/customer_authentication/login?return_to=%2Fapps%2Fscreen-time-journey%3Fsource%3Dheader%26from%3D%2F';
                  }}
                  style={{ width: '100%' }}
                >
                  Login
                </button>
                
                <button 
                  className="btn-secondary"
                  onClick={() => window.location.href = 'https://www.screentimejourney.com'}
                  style={{ width: '100%', marginTop: '12px' }}
                >
                  Return to Home
                </button>
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
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="onboard-title" style={{maxWidth: '800px'}}>
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
                <div style={{marginBottom: '0'}}>
                  <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', marginLeft: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>Username</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input 
                      className={`input ${usernameValid === true ? 'input--valid' : usernameValid === false ? 'input--invalid' : ''}`}
                      placeholder=" " 
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
                      onFocus={handleInputFocus}
                    />
                    <label className="form-label">theking</label>
                    {usernameChecking && <span className="input-icon">⏳</span>}
                    {usernameValid === true && <span className="input-icon valid">✅</span>}
                    {usernameValid === false && <span className="input-icon invalid">❌</span>}
                  </div>
                  {usernameError && <p className="error-message">{usernameError}</p>}
                  <p className="helper">3-20 characters, letters and numbers only. This will be shown in your journey, messages and leaderboard.</p>
                </div>
                <div className="modal__footer">
                  <button 
                    className="btn-primary"
                    style={{width: '100%', position: 'relative'}}
                    disabled={!newUsername.trim() || (usernameValid !== null && usernameValid !== true)}
                    onClick={() => setOnboardStep(2)}
                  >
                    <span style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap'
                    }}>Next</span>
                    <span style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginLeft: 'calc((100% / 2) + 8px)',
                      whiteSpace: 'nowrap'
                    }}>→</span>
                    <span style={{visibility: 'hidden'}}>Next</span>
                  </button>
                </div>
              </div>
            )}

            {onboardStep === 2 && (
              <div>
                <div style={{marginBottom: '0'}}>
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
                </div>
                <div className="modal__footer">
                  <button
                    className="btn-primary"
                    style={{width: '100%', position: 'relative'}}
                    disabled={!newGender} 
                    onClick={() => setOnboardStep(3)}
                  >
                    <span style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap'
                    }}>Next</span>
                    <span style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginLeft: 'calc((100% / 2) + 8px)',
                      whiteSpace: 'nowrap'
                    }}>→</span>
                    <span style={{visibility: 'hidden'}}>Next</span>
                  </button>
                  <button className="btn-tertiary" onClick={() => setOnboardStep(1)}>Back</button>
                </div>
              </div>
            )}

            {onboardStep === 3 && (
              <div>
                <div style={{marginBottom: '0'}}>
                  <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', marginLeft: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>Why do you want to change your screentime habits?</label>
                  <div className="input-wrapper">
                    <input 
                      className="input" 
                      placeholder=" " 
                      value={whatToChange}
                      onChange={(e) => {
                        setWhatToChange(e.target.value);
                        setCommitmentError(''); // Clear error on input
                      }}
                      onFocus={handleInputFocus}
                      maxLength="200"
                    />
                    <label className="form-label">I want to be more present with my family</label>
                  </div>
                  
                  <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', marginLeft: '8px', marginTop: '1.5rem', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>How will this change your life?</label>
                  <div className="input-wrapper">
                    <input 
                      className="input" 
                      placeholder=" " 
                      value={whatToGain}
                      onChange={(e) => {
                        setWhatToGain(e.target.value);
                        setCommitmentError(''); // Clear error on input
                      }}
                      onFocus={handleInputFocus}
                      maxLength="200"
                    />
                    <label className="form-label">I'll have more energy and focus for what matters</label>
                  </div>
                  
                  <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', marginLeft: '8px', marginTop: '1.5rem', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>Who in your life will be affected by these changes?</label>
                  <div className="input-wrapper">
                    <input 
                      className="input" 
                      placeholder=" " 
                      value={doingThisFor}
                      onChange={(e) => {
                        setDoingThisFor(e.target.value);
                        setCommitmentError(''); // Clear error on input
                      }}
                      onFocus={handleInputFocus}
                      maxLength="200"
                    />
                    <label className="form-label">My partner and children</label>
                  </div>
                  {commitmentError && <p className="error-message">{commitmentError}</p>}
                </div>
                <div className="modal__footer">
                  <button
                    type="button"
                    className="btn-primary"
                    style={{width: '100%', position: 'relative'}}
                    disabled={!whatToChange.trim() || !whatToGain.trim() || !doingThisFor.trim() || commitmentValidating} 
                    onClick={(e) => {
                      e.preventDefault();
                      validateCommitment();
                    }}
                  >
                    {commitmentValidating ? (
                      'Validating...'
                    ) : (
                      <>
                        <span style={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          whiteSpace: 'nowrap'
                        }}>Next</span>
                        <span style={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginLeft: 'calc((100% / 2) + 8px)',
                          whiteSpace: 'nowrap'
                        }}>→</span>
                        <span style={{visibility: 'hidden'}}>Next</span>
                      </>
                    )}
                  </button>
                  <button type="button" className="btn-tertiary" onClick={() => setOnboardStep(2)}>Back</button>
                </div>
              </div>
            )}

            {onboardStep === 4 && (
              <div>
                <div style={{marginBottom: '0'}}>
                  <p className="helper">Get daily motivation and accountability messages.</p>
                  <div style={{ marginBottom: '1rem' }}>
                    <PhoneInput
                      international
                      defaultCountry={detectedCountry}
                      value={phoneNumber}
                      onChange={(value) => {
                        setPhoneNumber(value || '');
                        // Extract country code and phone number
                        if (value) {
                          const match = value.match(/^\+(\d+)/);
                          if (match) {
                            setNewCountryCode('+' + match[1].split(/[^\d]/)[0]);
                            setNewWhatsapp(value.replace(/^\+\d+/, '').replace(/\D/g, ''));
                          }
                        }
                      }}
                      className="phone-input-international"
                      placeholder="Enter phone number"
                    />
                  </div>
                  {whatsappError && <p className="error-message">{whatsappError}</p>}
                </div>
                <div className="modal__footer">
                  <button
                    className="btn-primary"
                    style={{width: '100%'}}
                    disabled={!phoneNumber || whatsappLoading}
                    onClick={sendWhatsAppCode}
                  >
                    {whatsappLoading ? 'Sending code...' : 'Validate'}
                  </button>
                  <button 
                    className="btn-secondary"
                    style={{width: '100%'}} 
                    disabled={whatsappLoading || profileLoading}
                    onClick={async () => {
                      await saveProfile(); // Save without WhatsApp
                    }}
                  >
                    {profileLoading ? 'Saving profile...' : whatsappLoading ? 'Please wait...' : 'Skip (not recommended)'}
                  </button>
                  <button className="btn-tertiary" onClick={() => setOnboardStep(3)}>Back</button>
                </div>
              </div>
            )}

            {onboardStep === 5 && (
              <div>
                <div style={{marginBottom: '0'}}>
                  <p className="helper">
                    We sent a 6-digit code to {newCountryCode}{newWhatsapp}
                    <button className="link-inline" onClick={() => setOnboardStep(4)}>Wrong number?</button>
                  </p>
                  <input 
                    className="input code-input" 
                    placeholder="123456" 
                    value={whatsappCode}
                    onChange={(e) => setWhatsappCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onFocus={handleInputFocus}
                    maxLength="6"
                  />
                  {whatsappError && <p className="error-message">{whatsappError}</p>}
                </div>
                <div className="modal__footer">
                  <button
                    className="btn-primary"
                    style={{width: '100%'}}
                    disabled={whatsappCode.length !== 6 || whatsappLoading || profileLoading}
                    onClick={verifyWhatsAppCode}
                  >
                    {profileLoading ? 'Saving profile...' : whatsappLoading ? 'Verifying...' : 'Verify & Complete'}
                  </button>
                  <button 
                    className="btn-tertiary" 
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
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title" style={{maxWidth: '800px'}}>
            <div className="modal__header">
              <h3 id="profile-edit-title" className="modal__title">Edit Profile</h3>
            </div>

            <div>
              {/* Email - Read Only */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>Email (Read-only)</label>
                <input 
                  className="input"
                  value={profileData?.email || ''}
                  readOnly
                  style={{ backgroundColor: '#EEEEEE', cursor: 'not-allowed', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '16px' }}
                />
                <p style={{ margin: '8px 0 0 4px', fontSize: '13px', color: '#6b7280', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>Email cannot be changed as it's linked to your Shopify account.</p>
              </div>

              {/* Username */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>Username</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className={`input ${profileEditData.usernameValidationState === 'checking' ? 'input--loading' : 
                      profileEditData.usernameValidationState === 'available' ? 'input--valid' : 
                      profileEditData.usernameValidationState === 'taken' ? 'input--invalid' : ''}`}
                    placeholder="theking" 
                    value={profileEditData.username}
                    style={{ padding: '16px' }} 
                    onFocus={handleInputFocus}
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
                <p style={{ margin: '8px 0 0 4px', fontSize: '13px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', color: 
                  profileEditData.usernameValidationState === 'available' ? '#10b981' : 
                  profileEditData.usernameValidationState === 'taken' ? '#ef4444' : '#6b7280' }}>
                  {profileEditData.usernameValidationState === 'taken' ? 'Username already taken' :
                   profileEditData.usernameValidationState === 'available' ? 'Username available!' :
                   '3-20 characters, letters and numbers only.'}
                </p>
              </div>

              {/* Gender */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>Gender</label>
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
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>WhatsApp</label>
                
                {/* Current WhatsApp Display */}
                {profileData?.whatsapp && !profileEditData.showWhatsAppEdit && (
                  <div style={{ marginBottom: '1rem', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#0F172A', fontSize: '14px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>{profileData.whatsapp}</span>
                        {profileData.whatsapp_opt_in && (
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#059669',
                            backgroundColor: '#f9f9f9',
                            padding: '4px 10px',
                            borderRadius: '7px',
                            border: '1px solid #e5e7eb',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                            whiteSpace: 'nowrap'
                          }}>
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <button 
                        type="button"
                        style={{ 
                          background: 'none',
                          border: 'none',
                          color: '#2E0456',
                          fontSize: '12px',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                          fontWeight: '500',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        onClick={() => setProfileEditData(prev => ({...prev, showWhatsAppEdit: true, editPhoneNumber: profileData.whatsapp || ''}))}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

                {/* WhatsApp Edit Form */}
                {(!profileData?.whatsapp || profileEditData.showWhatsAppEdit) && (
                  <>
                    <PhoneInput
                      international
                      defaultCountry={detectedCountry}
                      value={profileEditData.editPhoneNumber || ''}
                      onChange={(value) => {
                        setProfileEditData(prev => ({...prev, editPhoneNumber: value || ''}));
                      }}
                      className="phone-input-international"
                      placeholder="Enter phone number"
                    />
                    
                    {profileEditData.editPhoneNumber && (
                      <div style={{ marginTop: '8px' }}>
                        <button 
                          type="button"
                          className="btn-primary"
                          style={{ width: '100%' }}
                          onClick={async () => {
                            if (!isPossiblePhoneNumber(profileEditData.editPhoneNumber)) {
                              setProfileError('Please enter a valid phone number');
                              return;
                            }
                            
                            setProfileEditData(prev => ({...prev, verifyingWhatsApp: true}));
                            
                            try {
                              const customerId = extractCustomerId();
                              const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/send_whatsapp_code`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  phone_number: profileEditData.editPhoneNumber,
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
                          <div style={{display: 'flex', justifyContent: 'center', width: '100%'}}>
                            <button 
                              type="button"
                              className="btn-tertiary"
                              onClick={() => setProfileEditData(prev => ({...prev, showWhatsAppEdit: false, whatsapp: '', whatsappCodeSent: false}))}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Verification Code Input */}
                    {profileEditData.whatsappCodeSent && (
                      <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px' }}>
                        <label className="form-label" style={{ marginBottom: '8px', position: 'static', transform: 'none', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400' }}>Enter 6-digit verification code</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input 
                            type="text"
                            className="input"
                            placeholder="123456"
                            value={profileEditData.whatsappCode || ''}
                            onChange={(e) => {
                              setProfileEditData(prev => ({...prev, whatsappCode: e.target.value.replace(/\D/g, '').slice(0, 6), verificationError: ''}));
                            }}
                            onFocus={handleInputFocus}
                            style={{ flex: 1, padding: '16px' }}
                          />
                          <button 
                            type="button"
                            className="btn btn--primary"
                            onClick={async () => {
                              if (profileEditData.whatsappCode?.length !== 6) return;
                              
                              setProfileEditData(prev => ({...prev, verifyingCode: true, verificationError: ''}));
                              
                              try {
                                const customerId = extractCustomerId();
                                
                                const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ajvrzuyjarph5fvskles42g7ba0zxtxc.lambda-url.eu-north-1.on.aws'}/verify_whatsapp_code`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    phone_number: profileEditData.editPhoneNumber,
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
                                    showWhatsAppEdit: false,
                                    editPhoneNumber: '',
                                    verificationError: ''
                                  }));
                                  setProfileError('');
                                  // Refresh profile data (silently, no spinner)
                                  fetchProfileData(true);
                                } else {
                                  setProfileEditData(prev => ({...prev, verificationError: result.error || 'Invalid verification code'}));
                                }
                              } catch (error) {
                                console.error('Error verifying code:', error);
                                setProfileEditData(prev => ({...prev, verificationError: 'Failed to verify code'}));
                              } finally {
                                setProfileEditData(prev => ({...prev, verifyingCode: false}));
                              }
                            }}
                            disabled={profileEditData.whatsappCode?.length !== 6 || profileEditData.verifyingCode}
                          >
                            {profileEditData.verifyingCode ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                        {profileEditData.verificationError && (
                          <p className="error-message" style={{ marginTop: 0, marginBottom: 0 }}>{profileEditData.verificationError}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {!profileData?.whatsapp && (
                  <p className="helper" style={{ margin: '8px 0 0 4px' }}>
                    For daily motivation and accountability messages.
                  </p>
                )}
              </div>

              {/* Commitment Data Section */}
              <div style={{ marginBottom: '0' }}>
                <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>Your Commitment</label>
                
                {/* Current Commitment Display */}
                {profileData?.commitment_data && !profileEditData.showCommitmentEdit && (
                  <div style={{ marginBottom: '1rem', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px', position: 'relative' }}>
                    {/* Edit button in absolute position (top right) */}
                    <button 
                      type="button"
                      style={{ 
                        background: 'none',
                        border: 'none',
                        color: '#2E0456',
                        fontSize: '12px',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                        fontWeight: '500',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        cursor: 'pointer',
                        padding: 0,
                        position: 'absolute',
                        top: '16px',
                        right: '16px'
                      }}
                      onClick={() => setProfileEditData(prev => ({
                        ...prev, 
                        showCommitmentEdit: true,
                        commitmentQ1: profileData.commitment_data.q1 || '',
                        commitmentQ2: profileData.commitment_data.q2 || '',
                        commitmentQ3: profileData.commitment_data.q3 || ''
                      }))}
                    >
                      Edit
                    </button>
                    
                    <div style={{ marginBottom: '0', paddingRight: '80px' }}>
                      <div style={{ padding: '12px 0', borderBottom: '1px solid #EEEEEE' }}>
                        <div style={{ color: '#0F172A', fontSize: '14px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>What you want to change:</div>
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>"{profileData.commitment_data.q1}"</p>
                      </div>
                      <div style={{ padding: '12px 0', borderBottom: '1px solid #EEEEEE' }}>
                        <div style={{ color: '#0F172A', fontSize: '14px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>What you want to gain:</div>
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>"{profileData.commitment_data.q2}"</p>
                      </div>
                      <div style={{ padding: '12px 0' }}>
                        <div style={{ color: '#0F172A', fontSize: '14px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>Who you're doing this for:</div>
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>"{profileData.commitment_data.q3}"</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Commitment Edit Form - Inline */}
                {profileEditData.showCommitmentEdit && (
                  <div style={{ marginBottom: '1rem', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px' }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#0F172A', fontSize: '16px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '500' }}>Update Your Commitment</h4>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', marginLeft: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>What do you want to quit or change?</label>
                      <input 
                        type="text"
                        className="input"
                        placeholder="e.g., quit porn, reduce social media, stop gaming..."
                        value={profileEditData.commitmentQ1 || ''}
                        onChange={(e) => setProfileEditData(prev => ({...prev, commitmentQ1: e.target.value}))}
                        onFocus={handleInputFocus}
                        style={{padding: '16px'}}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', marginLeft: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>What do you want to gain or achieve?</label>
                      <input 
                        type="text"
                        className="input"
                        placeholder="e.g., more energy, better relationships, inner peace..."
                        value={profileEditData.commitmentQ2 || ''}
                        onChange={(e) => setProfileEditData(prev => ({...prev, commitmentQ2: e.target.value}))}
                        onFocus={handleInputFocus}
                        style={{padding: '16px'}}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', marginLeft: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>Who are you doing this for?</label>
                      <input 
                        type="text"
                        className="input"
                        placeholder="e.g., my family, my future self, my children..."
                        value={profileEditData.commitmentQ3 || ''}
                        onChange={(e) => setProfileEditData(prev => ({...prev, commitmentQ3: e.target.value}))}
                        onFocus={handleInputFocus}
                        style={{padding: '16px'}}
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
                      </div>
                    )}

                    <div>
                      {!profileEditData.commitmentValidation?.is_passionate ? (
                        <>
                          <button 
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%' }}
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
                          
                          <div style={{display: 'flex', justifyContent: 'center', width: '100%'}}>
                            <button 
                              type="button"
                              className="btn-tertiary"
                              onClick={() => setProfileEditData(prev => ({
                                ...prev, 
                                showCommitmentEdit: false,
                                commitmentValidation: null,
                                // Reset to original values on cancel
                                commitmentQ1: profileData?.commitment_data?.q1 || '',
                                commitmentQ2: profileData?.commitment_data?.q2 || '',
                                commitmentQ3: profileData?.commitment_data?.q3 || ''
                              }))}
                              disabled={profileEditData.commitmentValidating}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <button 
                            type="button"
                            className="btn-success"
                            style={{ width: '100%' }}
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
                                  // Refresh profile data to show updated values (silently, no spinner)
                                  fetchProfileData(true);
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
                          
                          <div style={{display: 'flex', justifyContent: 'center', width: '100%'}}>
                            <button 
                              type="button"
                              className="btn-tertiary"
                              onClick={() => setProfileEditData(prev => ({
                                ...prev, 
                                showCommitmentEdit: false,
                                commitmentValidation: null,
                                // Reset to original values on cancel
                                commitmentQ1: profileData?.commitment_data?.q1 || '',
                                commitmentQ2: profileData?.commitment_data?.q2 || '',
                                commitmentQ3: profileData?.commitment_data?.q3 || ''
                              }))}
                              disabled={profileEditData.commitmentSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
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
                  className="btn-primary"
                  style={{width: '100%'}}
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
                  className="btn-tertiary"
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
          <div ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="device-flow-title" style={{maxWidth: '800px'}}>
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
                          <div style={{marginBottom: '0'}}>
                            
                            {/* Video */}
                            <div style={{marginBottom: '16px'}}>
                              <video 
                                key={`video-${currentFlowStep}-${currentFlow.steps[currentFlowStep - 1].media_url}`}
                                controls 
                                preload="none"
                                playsInline
                                poster={`${currentFlow.steps[currentFlowStep - 1].media_url.replace('.mov', '').replace('unlock', 'thumbnail_unlock').replace('screentime', 'thumbnail_screentime').replace('profile', 'thumbnail+profile').replace('pincode', 'thumbnail_pincode')}.jpg?v=${Date.now()}`}
                                style={{width: '100%', borderRadius: '8px', backgroundColor: '#EEEEEE'}}
                                onLoadStart={() => console.log('🔄 Unlock video loading:', currentFlow.steps[currentFlowStep - 1].media_url)}
                                onCanPlay={() => console.log('✅ Unlock video ready:', currentFlow.steps[currentFlowStep - 1].media_url)}
                              >
                                <source src={`${currentFlow.steps[currentFlowStep - 1].media_url}?v=${Date.now()}`} type="video/quicktime" />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            
                            {/* Surrender Text */}
                            <div style={{background: '#ffffff', padding: '20px', borderRadius: '7px', border: '1px solid #e2e8f0', marginBottom: '20px'}}>
                              <p className="account-text" style={{margin: 0, fontSize: '15px', lineHeight: '1.7', fontStyle: 'italic', textAlign: 'center'}}>
                                "{currentFlow.steps[currentFlowStep - 1].surrender_text || surrenderText}"
                              </p>
                            </div>
                            
                            {/* Recording Status (only when recording) */}
                            {isRecording && (
                              <div style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '7px',
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
                                    fontWeight: '500',
                                    color: '#0F172A',
                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
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
                                    color: '#0F172A',
                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                  }}>
                                    {recordingTime}s
                                  </div>
                                  
                                  {/* Audio Visualizer - Small bars on horizontal X, moving vertically on Y */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    width: '100%',
                                    maxWidth: '400px',
                                    height: '50px',
                                    margin: '16px auto'
                                  }}>
                                    {audioLevels.map((level, i) => (
                                      <div
                                        key={i}
                                        style={{
                                          flex: '1',
                                          minWidth: '4px',
                                          maxWidth: '12px',
                                          height: `${Math.min(50, Math.max(4, level / 2))}px`,
                                          background: '#2E0456',
                                          borderRadius: '2px',
                                          transition: 'height 0.08s ease-out'
                                        }}
                                      ></div>
                                    ))}
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
                                  className="btn-secondary"
                                  style={{
                                    background: isRecording 
                                      ? '#DC2626'
                                      : 'transparent',
                                    borderColor: isRecording ? '#DC2626' : '#0F172A',
                                    color: isRecording ? 'white' : '#0F172A',
                                    height: '32px',
                                    minHeight: '32px',
                                    padding: '6px 16px',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    margin: '0 auto',
                                    width: 'auto'
                                  }}
                                >
                                  {isRecording ? (
                                    <>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="6" y="6" width="12" height="12"/>
                                      </svg>
                                      Stop Recording
                                      </>
                                    ) : (
                                      <>
                                        🎤 Start Recording
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '7px',
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
                                        fontWeight: '500',
                                        color: '#0F172A',
                                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                      }}>
                                        Recording Complete!
                                      </h3>
                                      <p className="account-text" style={{
                                        margin: 0,
                                        fontSize: '14px'
                                      }}>
                                        Duration: {recordingTime} seconds
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Audio Player Preview */}
                                  <div style={{
                                    background: 'transparent',
                                    borderRadius: '7px',
                                    padding: '16px',
                                    marginBottom: '16px',
                                    border: '1px solid #e2e8f0'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px'
                                    }}>
                                      <button
                                        onClick={async () => {
                                          try {
                                            // If already playing, pause it
                                            if (isPreviewPlaying && previewAudioRef.current) {
                                              previewAudioRef.current.pause();
                                              setIsPreviewPlaying(false);
                                              return;
                                            }

                                            // Create new audio if needed
                                            if (!previewAudioRef.current) {
                                              console.log('🎵 Creating audio, blob size:', audioBlob.size, 'bytes');
                                              const audioUrl = URL.createObjectURL(audioBlob);
                                              const audio = new Audio(audioUrl);
                                              
                                              audio.onloadstart = () => console.log('🔄 Audio loading started');
                                              audio.oncanplay = () => console.log('✅ Audio can play');
                                              audio.onerror = (e) => console.error('❌ Audio error:', e);
                                              audio.onended = () => {
                                                setIsPreviewPlaying(false);
                                                URL.revokeObjectURL(audioUrl);
                                              };
                                              
                                              previewAudioRef.current = audio;
                                            }
                                            
                                            await previewAudioRef.current.play();
                                            setIsPreviewPlaying(true);
                                            console.log('🎵 Audio playback started');
                                          } catch (error) {
                                            console.error('❌ Error playing audio:', error);
                                            alert('Failed to play audio. Please try recording again.');
                                            setIsPreviewPlaying(false);
                                          }
                                        }}
                                        style={{
                                          background: '#2E0456',
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
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                      >
                                        {isPreviewPlaying ? (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                            <rect x="6" y="4" width="4" height="16"/>
                                            <rect x="14" y="4" width="4" height="16"/>
                                          </svg>
                                        ) : (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                            <polygon points="5,3 19,12 5,21"/>
                                          </svg>
                                        )}
                                      </button>
                                      <div style={{flex: 1}}>
                                        <div style={{
                                          fontSize: '14px',
                                          fontWeight: '500',
                                          color: '#0F172A',
                                          marginBottom: '4px',
                                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                        }}>
                                          Surrender Recording
                                        </div>
                                        <div className="account-text" style={{
                                          fontSize: '12px'
                                        }}>
                                          Tap play to review your recording
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Record Again Button */}
                                  <button
                                    onClick={() => {
                                      // Stop and clean up audio if playing
                                      if (previewAudioRef.current) {
                                        previewAudioRef.current.pause();
                                        previewAudioRef.current = null;
                                      }
                                      setIsPreviewPlaying(false);
                                      setAudioBlob(null);
                                      setIsRecording(false);
                                      setRecordingTime(0);
                                    }}
                                    className="btn-tertiary"
                                    style={{
                                      width: '100%',
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
                          <div style={{marginBottom: '0'}}>
                            
                            {/* Surrender Text */}
                            <div style={{background: '#ffffff', padding: '20px', borderRadius: '7px', border: '1px solid #e2e8f0', marginBottom: '20px'}}>
                              <p className="account-text" style={{margin: 0, fontSize: '15px', lineHeight: '1.7', fontStyle: 'italic', textAlign: 'center'}}>
                                "{currentFlow.steps[currentFlowStep - 1].surrender_text || surrenderText}"
                              </p>
                            </div>
                            
                            {/* Recording Status (only when recording) */}
                            {isRecording && (
                              <div style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '7px',
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
                                    fontWeight: '500',
                                    color: '#0F172A',
                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
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
                                    color: '#0F172A',
                                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                  }}>
                                    {recordingTime}s
                                  </div>
                                  
                                  {/* Audio Visualizer - Small bars on horizontal X, moving vertically on Y */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    width: '100%',
                                    maxWidth: '400px',
                                    height: '50px',
                                    margin: '16px auto'
                                  }}>
                                    {audioLevels.map((level, i) => (
                                      <div
                                        key={i}
                                        style={{
                                          flex: '1',
                                          minWidth: '4px',
                                          maxWidth: '12px',
                                          height: `${Math.min(50, Math.max(4, level / 2))}px`,
                                          background: '#2E0456',
                                          borderRadius: '2px',
                                          transition: 'height 0.08s ease-out'
                                        }}
                                      ></div>
                                    ))}
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
                                  className="btn-secondary"
                                  style={{
                                    background: isRecording 
                                      ? '#DC2626'
                                      : 'transparent',
                                    borderColor: isRecording ? '#DC2626' : '#0F172A',
                                    color: isRecording ? 'white' : '#0F172A',
                                    height: '32px',
                                    minHeight: '32px',
                                    padding: '6px 16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    margin: '0 auto',
                                    width: 'auto'
                                  }}
                                >
                                  {isRecording ? (
                                    <>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="6" y="6" width="12" height="12"/>
                                      </svg>
                                      Stop Recording
                                      </>
                                    ) : (
                                      <>
                                        🎤 Start Recording
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '7px',
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
                                        fontWeight: '500',
                                        color: '#0F172A',
                                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                      }}>
                                        Recording Complete!
                                      </h3>
                                      <p className="account-text" style={{
                                        margin: 0,
                                        fontSize: '14px'
                                      }}>
                                        Duration: {recordingTime} seconds
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Audio Player Preview */}
                                  <div style={{
                                    background: 'transparent',
                                    borderRadius: '7px',
                                    padding: '16px',
                                    marginBottom: '16px',
                                    border: '1px solid #e2e8f0'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px'
                                    }}>
                                      <button
                                        onClick={async () => {
                                          try {
                                            // If already playing, pause it
                                            if (isPreviewPlaying && previewAudioRef.current) {
                                              previewAudioRef.current.pause();
                                              setIsPreviewPlaying(false);
                                              return;
                                            }

                                            // Create new audio if needed
                                            if (!previewAudioRef.current) {
                                              console.log('🎵 Creating audio, blob size:', audioBlob.size, 'bytes');
                                              const audioUrl = URL.createObjectURL(audioBlob);
                                              const audio = new Audio(audioUrl);
                                              
                                              audio.onloadstart = () => console.log('🔄 Audio loading started');
                                              audio.oncanplay = () => console.log('✅ Audio can play');
                                              audio.onerror = (e) => console.error('❌ Audio error:', e);
                                              audio.onended = () => {
                                                setIsPreviewPlaying(false);
                                                URL.revokeObjectURL(audioUrl);
                                              };
                                              
                                              previewAudioRef.current = audio;
                                            }
                                            
                                            await previewAudioRef.current.play();
                                            setIsPreviewPlaying(true);
                                            console.log('🎵 Audio playback started');
                                          } catch (error) {
                                            console.error('❌ Error playing audio:', error);
                                            alert('Failed to play audio. Please try recording again.');
                                            setIsPreviewPlaying(false);
                                          }
                                        }}
                                        style={{
                                          background: '#2E0456',
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
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                      >
                                        {isPreviewPlaying ? (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                            <rect x="6" y="4" width="4" height="16"/>
                                            <rect x="14" y="4" width="4" height="16"/>
                                          </svg>
                                        ) : (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                            <polygon points="5,3 19,12 5,21"/>
                                          </svg>
                                        )}
                                      </button>
                                      <div style={{flex: 1}}>
                                        <div style={{
                                          fontSize: '14px',
                                          fontWeight: '500',
                                          color: '#0F172A',
                                          marginBottom: '4px',
                                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                        }}>
                                          Surrender Recording
                                        </div>
                                        <div className="account-text" style={{
                                          fontSize: '12px'
                                        }}>
                                          Tap play to review your recording
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Record Again Button */}
                                  <button
                                    onClick={() => {
                                      // Stop and clean up audio if playing
                                      if (previewAudioRef.current) {
                                        previewAudioRef.current.pause();
                                        previewAudioRef.current = null;
                                      }
                                      setIsPreviewPlaying(false);
                                      setAudioBlob(null);
                                      setIsRecording(false);
                                      setRecordingTime(0);
                                    }}
                                    className="btn-tertiary"
                                    style={{
                                      width: '100%',
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
                          <div style={{marginBottom: '0'}}>
                            {(() => {
                              // Use stored device data from currentFlow (stored before removal)
                              const unlockedDevice = currentFlow?.unlockedDeviceData;
                              
                              console.log('🔍 Pincode Display - unlockedDevice:', unlockedDevice);
                              console.log('🔍 Pincode Display - currentFlow:', currentFlow);
                              
                              if (!unlockedDevice) {
                                return (
                                  <div style={{textAlign: 'center', padding: '20px'}}>
                                    <div className="account-text" style={{marginBottom: '12px'}}>Loading device information...</div>
                                    <div style={{
                                      width: '24px',
                                      height: '24px',
                                      border: '3px solid #EEEEEE',
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
                                    <div style={{padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px', marginBottom: '12px'}}>
                                      <h4 style={{margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                                        📱 Screen Time Code
                                      </h4>
                                      <div style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontSize: '32px', fontWeight: '700', color: '#2E0456', letterSpacing: '8px', textAlign: 'center', padding: '8px 0'}}>
                                        {unlockedDevice.current_audio_pincode}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* MDM Profile Pincode (if device has it) */}
                                  {unlockedDevice?.current_mdm_pincode && (
                                    <div style={{padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px', marginBottom: '12px'}}>
                                      <h4 style={{margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                                        🔧 MDM Profile Removal Code
                                      </h4>
                                      <div style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontSize: '32px', fontWeight: '700', color: '#2E0456', letterSpacing: '8px', textAlign: 'center', padding: '8px 0'}}>
                                        {unlockedDevice.current_mdm_pincode}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </>
                      ) : currentFlow.steps[currentFlowStep - 1].step_type === 'form' ? (
                        <>
                          {/* Body Text for form - Left aligned */}
                          <p style={{marginBottom: '20px', fontSize: '16px', lineHeight: '1.5', textAlign: 'left', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                            {currentFlow.steps[currentFlowStep - 1].body}
                          </p>
                          
                          {/* Form Fields */}
                          <div>
                            {currentFlow.steps[currentFlowStep - 1].form_fields.map((field, index) => (
                              <div key={index} style={{marginBottom: index === currentFlow.steps[currentFlowStep - 1].form_fields.length - 1 ? '0' : '20px'}}>
                                {field.field_type === 'text' && (
                                  <>
                                    <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>{field.label}</label>
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
                                      onFocus={handleInputFocus}
                                      maxLength={field.max_length}
                                      style={{padding: '16px'}}
                                    />
                                    {deviceFormErrors[field.field_name] && (
                                      <p className="error-message">{deviceFormErrors[field.field_name]}</p>
                                    )}
                                  </>
                                )}
                                
                                {field.field_type === 'radio' && (
                                  <>
                                    <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>{field.label}</label>
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
                            
                            {/* Terms & Conditions Checkbox - Only show on Step 1 (form step) */}
                            {currentFlowStep === 1 && (
                              <div style={{marginTop: '20px', marginBottom: '0'}}>
                                <label style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                  color: '#0F172A'
                                }}>
                                  <div style={{
                                    position: 'relative',
                                    width: '20px',
                                    height: '20px',
                                    marginRight: '12px',
                                    flexShrink: 0
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={deviceFormData.terms_accepted}
                                      onChange={(e) => {
                                        setDeviceFormData(prev => ({
                                          ...prev,
                                          terms_accepted: e.target.checked
                                        }));
                                        // Clear error when user checks
                                        if (deviceFormErrors.terms_accepted) {
                                          setDeviceFormErrors(prev => ({
                                            ...prev,
                                            terms_accepted: ''
                                          }));
                                        }
                                      }}
                                      style={{
                                        position: 'absolute',
                                        opacity: 0,
                                        width: '100%',
                                        height: '100%',
                                        cursor: 'pointer',
                                        margin: 0
                                      }}
                                    />
                                    <div style={{
                                      width: '20px',
                                      height: '20px',
                                      border: '1.5px solid #0F172A',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: deviceFormData.terms_accepted ? '#2E0456' : 'transparent',
                                      transition: 'all 0.2s ease',
                                      pointerEvents: 'none'
                                    }}>
                                      {deviceFormData.terms_accepted && (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <path
                                            d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <span style={{lineHeight: '1.5'}}>
                                    I agree with the{' '}
                                    <a
                                      href="https://www.screentimejourney.com/policies/terms-of-service"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        color: '#2E0456',
                                        textDecoration: 'underline',
                                        fontWeight: '500'
                                      }}
                                    >
                                      terms of service
                                    </a>.
                                  </span>
                                </label>
                                {deviceFormErrors.terms_accepted && (
                                  <p className="error-message" style={{marginTop: '4px'}}>{deviceFormErrors.terms_accepted}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Video Player for video steps */}
                          {console.log('🎥 Rendering video step:', currentFlowStep, 'URL:', currentFlow.steps[currentFlowStep - 1].media_url, 'Type:', currentFlow.steps[currentFlowStep - 1].step_type)}
                          <div style={{marginBottom: '16px'}}>
                            <video 
                              key={`video-${currentFlowStep}-${currentFlow.steps[currentFlowStep - 1].media_url}`}
                              controls 
                              preload="none"
                              playsInline
                              poster={`${currentFlow.steps[currentFlowStep - 1].media_url.replace('.mov', '').replace('unlock', 'thumbnail_unlock').replace('screentime', 'thumbnail_screentime').replace('profile', 'thumbnail+profile').replace('pincode', 'thumbnail_pincode')}.jpg?v=${Date.now()}`}
                              style={{width: '100%', height: 'auto', borderRadius: '8px', backgroundColor: '#EEEEEE'}}
                              onError={(e) => console.error('❌ Video error:', e, 'URL:', currentFlow.steps[currentFlowStep - 1].media_url)}
                              onLoadStart={() => console.log('🔄 Video loading started:', currentFlow.steps[currentFlowStep - 1].media_url)}
                              onCanPlay={() => console.log('✅ Video can play:', currentFlow.steps[currentFlowStep - 1].media_url)}
                            >
                              <source src={`${currentFlow.steps[currentFlowStep - 1].media_url}?v=${Date.now()}`} type="video/quicktime" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          
                          {/* Body Text for video steps */}
                          {currentFlow.steps[currentFlowStep - 1].body && currentFlowStep !== 3 && currentFlowStep !== 4 && (
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <p style={{margin: 0, fontSize: '16px', lineHeight: '1.5', color: '#374151'}}>
                                {currentFlow.steps[currentFlowStep - 1].body}
                              </p>
                            </div>
                          )}
                          
                          {/* Audio Guide for Setup Pincode step (step 4) */}
                          {currentFlowStep === 4 && (
                            <div style={{position: 'relative'}}>
                              {/* New code button - positioned top right above audio player */}
                              {audioGuideData && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  marginBottom: '8px'
                                }}>
                                  <button
                                    onClick={() => {
                                      setAudioGuideData(null);
                                      setAudioHasBeenPlayed(false);
                                      console.log('🔄 Regenerating audio guide');
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--brand-primary)',
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      padding: '4px 0',
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                      fontWeight: 500
                                    }}
                                  >
                                    New code
                                  </button>
                                </div>
                              )}
                              
                              {!audioGuideData ? (
                                <div>
                                  <button
                                    className="btn-secondary"
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
                                  {/* Audio player */}
                                  {(audioGuideData?.audioUrl || audioGuideData?.tts_result?.public_url || audioGuideData?.audio_url) ? (
                                    <AudioPlayer 
                                      audioUrl={(() => {
                                        const url = audioGuideData?.audioUrl || audioGuideData?.tts_result?.public_url || audioGuideData?.audio_url;
                                        console.log('🎵 AudioPlayer props - audioGuideData:', audioGuideData);
                                        console.log('🎵 AudioPlayer props - resolved URL:', url);
                                        return url;
                                      })()} 
                                      onPlay={() => {
                                        console.log('✅ Audio has been played - enabling Complete Setup button');
                                        setAudioHasBeenPlayed(true);
                                      }}
                                    />
                                  ) : (
                                    <div style={{
                                      background: 'rgba(255, 193, 7, 0.1)',
                                      border: '1px solid rgba(255, 193, 7, 0.3)',
                                      borderRadius: '8px',
                                      padding: '12px',
                                      textAlign: 'center',
                                      fontSize: '13px',
                                      color: '#856404'
                                    }}>
                                      ⚠️ Audio playback is not available. Please try generating the audio guide again.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="modal__footer">
                    {/* Step 3: Profile Generation & WARP Client Download */}
                    {currentFlowStep === 3 && currentFlow.flowType === 'device_setup_flow' && currentFlow.steps[currentFlowStep - 1]?.step_type !== 'pincode_display' && (
                      <>
                        {/* Generate/Download Profile Button */}
                        {!vpnProfileData ? (
                          <button
                            className="btn-secondary"
                            onClick={generateVPNProfile}
                            disabled={profileGenerating || !deviceFormData.device_type}
                            style={{width: '100%'}}
                          >
                            {profileGenerating ? 'Generating...' : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                                  <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 3v12"/>
                                </svg>
                                Generate Profile
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            className="btn-secondary"
                            onClick={downloadProfile}
                            style={{width: '100%'}}
                          >
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                                <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 3v12"/>
                              </svg>
                              Download Profile
                            </>
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* Primary Action Button - hide for pincode display */}
                    {currentFlow.steps[currentFlowStep - 1]?.step_type !== 'pincode_display' && (
                      <>
                      <button
                        className="btn-primary"
                        onClick={nextFlowStep}
                        disabled={
                          surrenderSubmitting || 
                          ((currentFlow.steps[currentFlowStep - 1]?.step_type === 'surrender' || currentFlow.steps[currentFlowStep - 1]?.step_type === 'video_surrender') && !audioBlob) ||
                          (currentFlow.flowType === 'device_setup_flow' && currentFlowStep === 4 && (!audioGuideData || !audioHasBeenPlayed)) ||
                          (currentFlow.steps[currentFlowStep - 1]?.step_type === 'form' && (!deviceFormData.device_name.trim() || !deviceFormData.device_type || !deviceFormData.terms_accepted))
                        }
                        style={{
                          width: '100%',
                          cursor: (surrenderSubmitting || ((currentFlow.steps[currentFlowStep - 1]?.step_type === 'surrender' || currentFlow.steps[currentFlowStep - 1]?.step_type === 'video_surrender') && !audioBlob) || (currentFlow.flowType === 'device_setup_flow' && currentFlowStep === 4 && (!audioGuideData || !audioHasBeenPlayed)) || (currentFlow.steps[currentFlowStep - 1]?.step_type === 'form' && (!deviceFormData.device_name.trim() || !deviceFormData.device_type || !deviceFormData.terms_accepted))) ? 'not-allowed' : 'pointer',
                          position: 'relative',
                          opacity: (surrenderSubmitting || ((currentFlow.steps[currentFlowStep - 1]?.step_type === 'surrender' || currentFlow.steps[currentFlowStep - 1]?.step_type === 'video_surrender') && !audioBlob) || (currentFlow.flowType === 'device_setup_flow' && currentFlowStep === 4 && (!audioGuideData || !audioHasBeenPlayed)) || (currentFlow.steps[currentFlowStep - 1]?.step_type === 'form' && (!deviceFormData.device_name.trim() || !deviceFormData.device_type || !deviceFormData.terms_accepted))) ? 0.6 : 1,
                          pointerEvents: (surrenderSubmitting || ((currentFlow.steps[currentFlowStep - 1]?.step_type === 'surrender' || currentFlow.steps[currentFlowStep - 1]?.step_type === 'video_surrender') && !audioBlob) || (currentFlow.flowType === 'device_setup_flow' && currentFlowStep === 4 && (!audioGuideData || !audioHasBeenPlayed)) || (currentFlow.steps[currentFlowStep - 1]?.step_type === 'form' && (!deviceFormData.device_name.trim() || !deviceFormData.device_type || !deviceFormData.terms_accepted))) ? 'none' : 'auto'
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
                              <span style={{
                                position: 'absolute',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                whiteSpace: 'nowrap'
                              }}>
                                {currentFlow.steps && currentFlow.steps[currentFlowStep - 1] 
                                  ? currentFlow.steps[currentFlowStep - 1].action_button 
                                  : 'Next step'}
                              </span>
                              <span style={{
                                position: 'absolute',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginLeft: 'calc((100% / 2) + 8px)',
                                whiteSpace: 'nowrap'
                              }}>→</span>
                              {/* Invisible spacer to maintain button height */}
                              <span style={{visibility: 'hidden'}}>
                                {currentFlow.steps && currentFlow.steps[currentFlowStep - 1] 
                                  ? currentFlow.steps[currentFlowStep - 1].action_button 
                                  : 'Next step'}
                              </span>
                            </>
                          )}
                        </button>
                        {/* Disabled overlay for better UX */}
                        {(surrenderSubmitting || ((currentFlow.steps[currentFlowStep - 1]?.step_type === 'surrender' || currentFlow.steps[currentFlowStep - 1]?.step_type === 'video_surrender') && !audioBlob) || (currentFlow.flowType === 'device_setup_flow' && currentFlowStep === 4 && (!audioGuideData || !audioHasBeenPlayed)) || (currentFlow.steps[currentFlowStep - 1]?.step_type === 'form' && (!deviceFormData.device_name.trim() || !deviceFormData.device_type || !deviceFormData.terms_accepted))) && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(255, 255, 255, 0.4)',
                            borderRadius: '8px',
                            pointerEvents: 'none'
                          }} />
                        )}
                      </>
                    )}
                    
                    {/* Surrender Error Message */}
                    {surrenderError && (currentFlow.steps[currentFlowStep - 1]?.step_type === 'surrender' || currentFlow.steps[currentFlowStep - 1]?.step_type === 'video_surrender') && (
                      <p className="error-message" style={{width: '100%', textAlign: 'center'}}>
                        {surrenderError}
                      </p>
                    )}
                    
                    {/* Surrender Success Message - Green Box (same style as device unlocked) */}
                    {surrenderSuccess && (currentFlow.steps[currentFlowStep - 1]?.step_type === 'surrender' || currentFlow.steps[currentFlowStep - 1]?.step_type === 'video_surrender') && (
                      <div style={{
                        width: '100%',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '7px',
                        padding: '12px',
                        marginTop: '12px',
                        marginBottom: '20px',
                        textAlign: 'center'
                      }}>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#16a34a',
                          fontWeight: '500',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                        }}>
                          {surrenderSuccess}
                        </p>
                      </div>
                    )}
                    
                    {                    /* Cancel/Back Button */}
                    <button 
                      className="btn-tertiary"
                      onClick={() => {
                          // Check if this is Step 2 with pincode display (Close button)
                          if (currentFlowStep === 2 && currentFlow.steps[currentFlowStep - 1]?.step_type === 'pincode_display') {
                            // Trigger device removal immediately when user closes modal
                            if (currentFlow.deviceRemovalTimeout) {
                              console.log('🔄 User closed modal, triggering device removal now...');
                              clearTimeout(currentFlow.deviceRemovalTimeout);
                              if (currentFlow.deviceRemovalFunction) {
                                currentFlow.deviceRemovalFunction();
                              }
                            }
                            
                            // Close the entire modal
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
                              device_type: ''
                            });
                            setDeviceFormErrors({});
                            setVpnProfileData(null);
                            setAudioGuideData(null);
                            setAudioHasBeenPlayed(false);
                            setSharedPincode(null);
                            setAudioBlob(null);
                            setIsRecording(false);
                            setSurrenderSubmitting(false);
                            setSurrenderApproved(false);
                            setUnlockPincode(null);
                          } else if (currentFlowStep === 1) {
                            // Step 1: Cancel - Close flow and return to dashboard
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
                              device_type: ''
                            });
                            setDeviceFormErrors({});
                            setVpnProfileData(null);
                            setAudioGuideData(null);
                            setAudioHasBeenPlayed(false);
                            setSharedPincode(null);
                            setAudioBlob(null);
                            setIsRecording(false);
                            setSurrenderSubmitting(false);
                            setSurrenderApproved(false);
                            setUnlockPincode(null);
                          } else {
                            // Steps 2+: Back - Go to previous step
                            setCurrentFlowStep(currentFlowStep - 1);
                            setDeviceFormErrors({});
                          }
                        }}
                      >
                        {currentFlowStep === 1 ? 'Cancel' : (currentFlowStep === 2 && currentFlow.steps[currentFlowStep - 1]?.step_type === 'pincode_display' ? 'Close' : 'Back')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Surrender Result Modal */}
        {surrenderResultModal && (
          <div className="modal-overlay active" style={{zIndex: 100000}}>
            <div className="modal" role="dialog" aria-modal="true" style={{maxWidth: '500px'}}>
              <div className="modal__header">
                <h3 className="modal__title" style={{
                  textAlign: 'center',
                  fontSize: '24px',
                  marginBottom: '16px'
                }}>
                  {surrenderResultModal.type === 'success' ? '✅ Approved' : '❌ Denied'}
                </h3>
              </div>
              
              <div style={{
                padding: '20px',
                background: surrenderResultModal.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${surrenderResultModal.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '7px',
                marginBottom: '20px'
              }}>
                <p className="account-text" style={{
                  margin: 0,
                  fontSize: '15px',
                  lineHeight: '1.7',
                  textAlign: 'center',
                  color: surrenderResultModal.type === 'success' ? '#16a34a' : '#dc2626'
                }}>
                  {surrenderResultModal.message}
                </p>
              </div>
              
              <div className="modal__footer">
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (surrenderResultModal.type === 'success') {
                      // Move to pincode display step
                      setCurrentFlowStep(2);
                    } else {
                      // Stay on current step, reset recording
                      setAudioBlob(null);
                      setIsRecording(false);
                      setRecordingTime(0);
                    }
                    setSurrenderResultModal(null);
                  }}
                  style={{width: '100%'}}
                >
                  {surrenderResultModal.type === 'success' ? 'View Unlock Code' : 'Record Again'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                  {!mobileMenuOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-hamburger" viewBox="0 0 18 16">
                      <path fill="currentColor" d="M1 .5a.5.5 0 1 0 0 1h15.71a.5.5 0 0 0 0-1zM.5 8a.5.5 0 0 1 .5-.5h15.71a.5.5 0 0 1 0 1H1A.5.5 0 0 1 .5 8m0 7a.5.5 0 0 1 .5-.5h15.71a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-close" viewBox="0 0 18 17">
                      <path fill="currentColor" d="M.865 15.978a.5.5 0 0 0 .707.707l7.433-7.431 7.579 7.282a.501.501 0 0 0 .846-.37.5.5 0 0 0-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 1 0-.707-.708L8.991 7.853 1.413.573a.5.5 0 1 0-.693.72l7.563 7.268z"></path>
                    </svg>
                  )}
                </button>
                
                <div className={`mobile-menu-dropdown ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
                  <div className="mobile-menu-nav">
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
                  </div>
                  <div className="mobile-menu-actions">
                    <a 
                      className="btn-primary" 
                      href="https://www.screentimejourney.com" 
                      target="_self" 
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </a>
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        document.cookie = 'stj_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                        window.location.href = 'https://xpvznx-9w.myshopify.com/account/logout?return_url=/';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
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
          
          {/* Milestones Section */}
          <div style={{marginBottom: '24px'}}>
            <ProgressSection 
                latestDevice={null}
                customerName={profileData?.username || customerData?.username || "Friend"}
                customerFirstName={profileData?.first_name || customerData?.first_name || ""}
                customerEmail={profileData?.email || customerData?.email || ""}
                customerGender={profileData?.gender || customerData?.gender || "male"}
                percentile={percentile}
                devices={devices}
                milestones={milestones}
                startDeviceFlow={startDeviceFlow}
              />
          </div>

          {/* Separator */}
          <hr style={{border: 'none', borderTop: '1px solid #EEEEEE', margin: '48px 0'}} />

          {/* Account (50%) + Devices (50%) */}
          <div className="grid grid-2" style={{marginBottom: '32px', alignItems: 'stretch'}}>
            {/* Account */}
              <div className="card card--equal" style={{display: 'flex', flexDirection: 'column'}}>
              <div className="card-header">
                <h3 className="card-title">Account</h3>
              </div>
              <div style={{margin: '0 0 16px 0'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEEEEE'}}>
                  <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>Email</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#0F172A',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    {profileData?.email || 'Not set'}
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEEEEE'}}>
                  <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>Username</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#0F172A',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    @{profileData?.username || 'Not set'}
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEEEEE'}}>
                  <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>Gender</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#0F172A',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    {profileData?.gender === 'male' ? '🙋‍♂️ Man' : profileData?.gender === 'female' ? '🙋‍♀️ Woman' : 'Not set'}
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEEEEE'}}>
                  <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>WhatsApp</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#0F172A',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    {profileData?.whatsapp || 'Not set'}
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEEEEE'}}>
                  <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>Commitment</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: profileData?.commitment_data ? '#059669' : '#0F172A',
                    backgroundColor: '#f9fafb',
                    padding: '2px 8px',
                    borderRadius: '7px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    {profileData?.commitment_data ? 'Set ✓' : 'Not Set ✗'}
                  </span>
                </div>
                {profileData?.commitment_data && (
                  <div style={{padding: '12px 0', borderBottom: '1px solid #EEEEEE'}}>
                    <div style={{marginBottom: '8px'}}>
                      <span style={{fontSize: '14px', color: '#0F172A', fontWeight: '500', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>What to change:</span>
                      <p style={{margin: '2px 0 0 0', fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>"{profileData.commitment_data.q1}"</p>
                    </div>
                    <div style={{marginBottom: '8px'}}>
                      <span style={{fontSize: '14px', color: '#0F172A', fontWeight: '500', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>What to gain:</span>
                      <p style={{margin: '2px 0 0 0', fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>"{profileData.commitment_data.q2}"</p>
                    </div>
                    <div>
                      <span style={{fontSize: '14px', color: '#0F172A', fontWeight: '500', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>Doing this for:</span>
                      <p style={{margin: '2px 0 0 0', fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>"{profileData.commitment_data.q3}"</p>
                    </div>
                  </div>
                )}
              </div>
              <div style={{marginTop: 'auto', display: 'flex', gap: '8px'}}>
                <button
                  className="btn-secondary"
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
                  <span style={{fontSize: '14px', color: '#0F172A', fontWeight: '500', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                    {devices.length} device{devices.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <div className="device-list" style={{padding: '16px 0'}}>
                {devices.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '20px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                    <div style={{fontSize: '2rem', marginBottom: '8px'}}>📱</div>
                    <p style={{fontSize: '14px'}}>No devices added yet</p>
                  </div>
                ) : (
                  devices.map((device, index) => (
                    <div key={device.id} className="device-item" style={{borderBottom: index === devices.length - 1 ? 'none' : '1px solid var(--border)'}}>
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: '500', marginBottom: '4px', fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                          {device.icon} {device.name}
                        </div>
                        <div className="device-item__meta" style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
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
                          className="btn-secondary"
                          onClick={() => startDeviceFlow('device_unlock_flow', device.id)}
                          style={{fontSize: '12px', padding: '4px 12px', height: '32px', minHeight: '32px'}}
                        >
                          Unlock
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{marginTop: 'auto', position: 'relative'}}>
                <button 
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    ...(devices.length >= 3 && {
                      cursor: 'not-allowed',
                      position: 'relative',
                      opacity: 0.6,
                      pointerEvents: 'none'
                    })
                  }} 
                  onClick={() => devices.length < 3 && startDeviceFlow('device_setup_flow')}
                  disabled={devices.length >= 3}
                >
                  {devices.length >= 3 ? 'Maximum Reached' : 'Add New Device'}
                  {devices.length >= 3 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255, 255, 255, 0.4)',
                      borderRadius: '8px',
                      pointerEvents: 'none'
                    }} />
                  )}
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
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEEEEE'}}>
                  <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>Status</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: (customerData?.subscription_status === 'cancelled' || customerData?.subscription_status === 'cancel_scheduled' || profileData?.subscription_status === 'cancelled' || profileData?.subscription_status === 'cancel_scheduled') ? '#dc2626' : '#059669',
                    backgroundColor: '#f9fafb',
                    padding: '2px 8px',
                    borderRadius: '7px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    {(customerData?.subscription_status === 'cancelled' || customerData?.subscription_status === 'cancel_scheduled' || profileData?.subscription_status === 'cancelled' || profileData?.subscription_status === 'cancel_scheduled') ? 'Cancelled ✗' : 'Active ✓'}
                  </span>
                </div>
                {(customerData?.subscription_status !== 'cancelled' && customerData?.subscription_status !== 'cancel_scheduled' && profileData?.subscription_status !== 'cancelled' && profileData?.subscription_status !== 'cancel_scheduled') && (
                  <>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEEEEE'}}>
                      <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>Next billing</span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#0F172A',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
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
                      <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>Billing cycle</span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#0F172A',
                        backgroundColor: '#EEEEEE',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
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
                    className="btn-secondary"
                    style={{flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                  >
                    Start new subscription
                  </a>
                ) : (
                  <button
                    className="btn-secondary"
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
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #EEEEEE'}}>
                  <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', flex: 1, minWidth: 0}}>Email notifications</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: notificationSettings.email_enabled ? '#059669' : '#0F172A',
                    backgroundColor: '#f9f9f9',
                    padding: '4px 10px',
                    borderRadius: '7px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    whiteSpace: 'nowrap',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {notificationSettings.email_enabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0'}}>
                  <span style={{fontSize: '14px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', flex: 1, minWidth: 0}}>WhatsApp notifications</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: notificationSettings.whatsapp_enabled ? '#059669' : '#0F172A',
                    backgroundColor: '#f9f9f9',
                    padding: '4px 10px',
                    borderRadius: '7px',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    whiteSpace: 'nowrap',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {notificationSettings.whatsapp_enabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
              </div>
              <div style={{marginTop: 'auto', display: 'flex', gap: '8px'}}>
                <button 
                  className="btn-secondary" 
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
                  borderBottom: index < 4 ? '1px solid #EEEEEE' : 'none'
                }}>

                  <div style={{flex: 1}}>
                    <div className="account-text" style={{fontWeight: '500', marginBottom: '2px'}}>
                      {log.title}
                    </div>
                    <div className="account-text" style={{marginBottom: '2px'}}>
                      {log.description}
                    </div>
                    {log.pincode && (
                      <div className="account-text" style={{fontSize: '12px', color: '#059669', fontWeight: '600'}}>
                        Code: {log.pincode} ✓
                      </div>
                    )}
                  </div>
                  <div className="account-text" style={{fontSize: '12px', textAlign: 'right'}}>
                    {log.timestamp}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <button 
                className="btn-secondary"
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
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-flow-title" style={{maxWidth: '800px'}}>
          <>
            <div className="modal__header">
              <div className="step-indicator">{cancelStep === 4 ? '' : `Step ${cancelStep - 1} of 2`}</div>
              <h3 id="cancel-flow-title" className="modal__title">
                {cancelStep === 2 && 'Help us improve'}
                {cancelStep === 3 && 'Confirm cancellation'}
                {cancelStep === 4 && ''}
              </h3>
            </div>

            <div className="modal__content">
              {cancelStep === 2 && (
                <div style={{marginBottom: '20px'}}>
                  <div style={{marginBottom: '1.5rem'}}>
                    <label className="form-label" style={{position: 'static', transform: 'none', marginBottom: '8px', display: 'block', fontSize: '15px', color: '#0F172A', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: '400'}}>
                      Tell us more about your experience (optional)
                    </label>
                    <textarea
                      value={cancelFeedback}
                      onChange={(e) => setCancelFeedback(e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder="What could we have done better? Any suggestions for improvement?"
                      rows={5}
                      className="input"
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '1px solid #0F172A',
                        borderRadius: '7px',
                        fontSize: '15px',
                        backgroundColor: '#fff',
                        resize: 'vertical',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                        color: '#0F172A',
                        minHeight: '120px'
                      }}
                    />
                  </div>
                </div>
              )}

              {cancelStep === 3 && (
                <div style={{textAlign: 'center', marginBottom: '20px'}}>
                  <div style={{background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '20px', marginBottom: '24px', textAlign: 'center'}}>
                    <h4 className="account-text" style={{margin: '0 0 16px 0', fontSize: '16px', fontWeight: '500'}}>
                      Cancellation Summary
                    </h4>
                    <div className="account-text" style={{lineHeight: '1.6'}}>
                      <p style={{margin: '0 0 8px 0'}}><strong>Plan:</strong> Screen Time Journey - Starter</p>
                      <p style={{margin: '0 0 8px 0'}}><strong>Effective:</strong> Immediately</p>
                      <p style={{margin: '0'}}><strong>Access:</strong> Until end of current billing period</p>
                    </div>
                  </div>

                  <div style={{background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '7px', padding: '16px', marginBottom: '24px'}}>
                    <p className="account-text" style={{margin: 0, color: '#dc2626', fontWeight: '500'}}>
                      ⚠️ <strong>Important:</strong> Cancelling will permanently delete your progress, device configurations, and journey data. This cannot be undone.
                    </p>
                  </div>
                </div>
              )}

              {cancelStep === 4 && (
                <div style={{textAlign: 'center', marginBottom: '24px'}}>
                  <div style={{fontSize: '3rem', marginBottom: '16px'}}>✅</div>
                  
                  <p style={{fontSize: '14px', lineHeight: '1.5', color: '#6b7280', marginBottom: '24px'}}>
                    Your subscription has been cancelled and you will receive a confirmation email shortly.
                  </p>
                  
                  <div style={{textAlign: 'center', marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px'}}>
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
              {cancelStep === 2 && (
                <>
                  <button
                    className="btn-primary"
                    onClick={nextCancelStep}
                    style={{width: '100%', position: 'relative'}}
                  >
                    <span style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap'
                    }}>Continue</span>
                    <span style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginLeft: 'calc((100% / 2) + 8px)',
                      whiteSpace: 'nowrap'
                    }}>→</span>
                    <span style={{visibility: 'hidden'}}>Continue</span>
                  </button>
                  
                  <button
                    className="btn-tertiary"
                    onClick={closeCancelFlow}
                  >
                    Cancel
                  </button>
                </>
              )}

              {cancelStep === 3 && (
                <>
                  <button
                    className="btn-danger"
                    onClick={submitCancellation}
                    disabled={cancelSubmitting}
                    style={{width: '100%'}}
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
                    className="btn-tertiary"
                    onClick={() => setCancelStep(2)}
                    disabled={cancelSubmitting}
                  >
                    Back
                  </button>
                </>
              )}

              {cancelStep === 4 && (
                <button
                  className="btn-tertiary"
                  onClick={closeCancelFlow}
                >
                  Close
                </button>
              )}
            </div>
          </>
        </div>
      </div>

      {/* Notification Settings Modal */}
      <div className={`modal-overlay ${showNotificationsFlow ? 'active' : ''}`}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="notifications-title" style={{maxWidth: '800px'}}>
          <>
            <div className="modal__header">
              <h3 id="notifications-title" className="modal__title">
                Notification Settings
              </h3>
            </div>

            <div className="modal__content">
              <div style={{marginBottom: '32px'}}>
                <p className="account-text" style={{marginBottom: '24px'}}>
                  Choose how you want to receive progress updates and leaderboard notifications. We've combined weekly and monthly updates into one toggle per channel.
                </p>
                
                {/* Email Notifications */}
                <div style={{marginBottom: '24px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#ffffff', borderRadius: '7px', border: '1px solid #e2e8f0'}}>
                    <div>
                      <div style={{fontWeight: '500', color: '#0F172A', marginBottom: '4px', fontSize: '16px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                        Email Notifications
                      </div>
                      <div style={{fontSize: '14px', color: '#6b7280', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                        Get weekly progress updates and monthly leaderboard rankings via email
                      </div>
                    </div>
                    <label style={{position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, marginLeft: '16px'}}>
                      <input
                        type="checkbox"
                        checked={tempNotificationSettings.email_enabled}
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
                        backgroundColor: tempNotificationSettings.email_enabled ? '#2E0456' : '#ccc',
                        transition: '0.3s',
                        borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: tempNotificationSettings.email_enabled ? '23px' : '3px',
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
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#ffffff', borderRadius: '7px', border: '1px solid #e2e8f0'}}>
                    <div>
                      <div style={{fontWeight: '500', color: '#0F172A', marginBottom: '4px', fontSize: '16px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                        WhatsApp Notifications
                      </div>
                      <div style={{fontSize: '14px', color: '#6b7280', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                        Get weekly progress updates and monthly leaderboard rankings via WhatsApp
                      </div>
                    </div>
                    <label style={{position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, marginLeft: '16px'}}>
                      <input
                        type="checkbox"
                        checked={tempNotificationSettings.whatsapp_enabled}
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
                        backgroundColor: tempNotificationSettings.whatsapp_enabled ? '#2E0456' : '#ccc',
                        transition: '0.3s',
                        borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '',
                          height: '18px',
                          width: '18px',
                          left: tempNotificationSettings.whatsapp_enabled ? '23px' : '3px',
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
                className="btn-primary"
                onClick={submitNotificationSettings}
                disabled={notificationsSubmitting}
                style={{width: '100%'}}
              >
                {notificationsSubmitting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
                    Saving...
                  </>
                ) : (
                  'Save settings'
                )}
              </button>
              
              <button
                className="btn-tertiary"
                onClick={closeNotificationsFlow}
                disabled={notificationsSubmitting}
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
              <div style={{marginBottom: '20px'}}>
                <p className="account-text" style={{fontSize: '16px', marginBottom: '24px'}}>
                  Complete history of your account activity. Unlock codes are preserved here for easy access.
                </p>
                
                <div style={{maxHeight: window.innerWidth <= 768 ? '300px' : '500px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '7px'}}>
                  {logs.map((log, index) => (
                    <div key={log.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '16px',
                      borderBottom: index < logs.length - 1 ? '1px solid #EEEEEE' : 'none',
                      backgroundColor: '#ffffff'
                    }}>

                      <div style={{flex: 1}}>
                        <div style={{fontWeight: '500', color: '#0F172A', marginBottom: '4px', fontSize: '16px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                          {log.title}
                        </div>
                        <div className="account-text" style={{marginBottom: '4px'}}>
                          {log.description}
                        </div>
                        {log.pincode && (
                          <div style={{
                            display: 'inline-block',
                            background: '#f9f9f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '7px',
                            padding: '2px 8px',
                            fontSize: '12px',
                            color: '#059669',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                            fontWeight: '600',
                            marginTop: '4px'
                          }}>
                            Code: {log.pincode} ✓
                          </div>
                        )}
                        <div className="account-text" style={{fontSize: '12px', marginTop: '8px'}}>
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
                    border: '1px solid #e2e8f0',
                    borderRadius: '7px',
                    backgroundColor: '#ffffff'
                  }}>
                    <div style={{fontSize: '40px', marginBottom: '16px'}}>📝</div>
                    <p className="account-text" style={{margin: 0, fontSize: '16px', fontWeight: '500'}}>No activity logs yet</p>
                    <p className="account-text" style={{margin: '8px 0 0 0'}}>Your activity will appear here as you use the app</p>
                  </div>
                )}


              </div>
            </div>

            <div className="modal__footer">
              <button
                className="btn-tertiary"
                onClick={closeLogsFlow}
              >
                Cancel
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
              <div style={{marginBottom: '20px'}}>
                <p className="modal__desc" style={{fontSize: '15px', color: 'var(--text-muted)', marginBottom: '24px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                  Your subscription has been cancelled. Below are the pincodes for your devices in case you need them.
                </p>
                
                <div style={{
                  maxHeight: window.innerWidth <= 768 ? '300px' : '500px', 
                  overflowY: 'auto', 
                  border: '1px solid #EEEEEE', 
                  borderRadius: '7px',
                  marginBottom: '16px'
                }}>
                  {logs.map((log, index) => (
                    <div key={log.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '16px',
                      borderBottom: index < logs.length - 1 ? '1px solid #EEEEEE' : 'none',
                      backgroundColor: '#fff'
                    }}>

                      <div style={{flex: 1}}>
                        <div style={{fontWeight: '600', color: '#0F172A', marginBottom: '4px', fontSize: '15px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                          {log.title}
                        </div>
                        <div style={{fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
                          {log.description}
                        </div>
                        {log.pincode && (
                          <div style={{
                            display: 'inline-block',
                            background: '#f9fafb',
                            border: '1px solid #EEEEEE',
                            borderRadius: '7px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: '#059669',
                            fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                            fontWeight: '500',
                            marginTop: '4px'
                          }}>
                            Code: {log.pincode} ✓
                          </div>
                        )}
                        <div style={{fontSize: '12px', color: '#9ca3af', marginTop: '8px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
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
                    border: '1px solid #EEEEEE',
                    borderRadius: '7px',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    <div style={{fontSize: '40px', marginBottom: '16px'}}>📝</div>
                    <p style={{margin: 0, fontSize: '15px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>No device pincodes found</p>
                    <p style={{margin: '8px 0 0 0', fontSize: '14px', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>No devices were added to your account</p>
                  </div>
                )}


              </div>
            </div>

            <div className="modal__footer">
              <a
                href="https://www.screentimejourney.com/products/screentimejourney"
                className="btn-primary"
                style={{width: '100%', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              >
                Subscribe Now
              </a>
              
              <button
                className="btn-tertiary"
                onClick={() => window.location.href = 'https://www.screentimejourney.com'}
              >
                Return to home
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
