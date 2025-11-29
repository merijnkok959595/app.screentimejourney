# Onboarding UI Fixes

## Issues to Fix:
1. ✅ Input text not outlined/centered properly
2. ✅ Username validation on onChange (real-time) instead of after form submission
3. ✅ Commitment form inputs not outlined properly
4. ✅ WhatsApp verification code failing to send

## Changes Required:

### 1. Add proper input border/outline styling
- All inputs in onboarding need consistent 1-2px solid border
- Remove floating label complexity for onboarding
- Keep text properly aligned

### 2. Real-time username validation
- Change from `onBlur={() => checkUsernameAvailability(newUsername)}`
- To: Check on every keystroke after minimum length (3 chars)
- Debounce the API calls (500ms delay)

### 3. Commitment form styling
- Add proper border to all 3 commitment questions
- Ensure consistent padding and alignment

### 4. WhatsApp verification debug
- Check AWS Secrets Manager for WATI token
- Verify WATI API credentials
- Check Lambda IAM permissions

## Implementation Plan:

### Frontend Fix (src/App.js):

```javascript
// Add debounce utility
const useDebounce = (value, delay) => {
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
};

// In the component:
const debouncedUsername = useDebounce(newUsername, 500);

useEffect(() => {
  if (debouncedUsername && debouncedUsername.length >= 3) {
    checkUsernameAvailability(debouncedUsername);
  }
}, [debouncedUsername]);

// Remove onBlur handler from input
```

### CSS Fix (src/App.css):

```css
/* Onboarding input consistency */
.modal .input {
  width: 100%;
  padding: 14px 40px 14px 16px; /* Right padding for validation icon */
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: white;
  color: #0F172A;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
}

.modal .input:focus {
  outline: none;
  border-color: #2E0456;
  border-width: 2px;
  padding: 13px 39px 13px 15px; /* Adjust for thicker border */
  box-shadow: 0 0 0 3px rgba(46, 4, 86, 0.08);
}

.modal .input::placeholder {
  color: #9ca3af;
  opacity: 1;
}
```

## Testing:
1. Remove username from DynamoDB ✅
2. Trigger onboarding popup ✅
3. Type username → should validate in real-time ✅
4. Check all inputs have visible borders ✅
5. Test WhatsApp code sending ⏳







