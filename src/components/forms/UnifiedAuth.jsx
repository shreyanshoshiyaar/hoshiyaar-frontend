import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSignupSource, setUserProperties } from '../../utils/analytics.js';
import './RobotAuth.css';

const HoshiyaarLogo = "https://res.cloudinary.com/dcxlzfyfp/image/upload/v1785322514/img-to-link/bihseec7aigbmau4amnd.png";

const UnifiedAuth = () => {
  // Steps: 1=Phone, 2=Password(Login), 3=OTP(Signup), 4=Details(Signup)
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [userName, setUserName] = useState('');

  // Mascot & Interaction State
  const [mood, setMood] = useState('idle');
  const [bubbleText, setBubbleText] = useState("Hi! I'm Hoshi. I guard your account.");
  const [isTurned, setIsTurned] = useState(false);
  const [isHyped, setIsHyped] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pwdScore, setPwdScore] = useState(0);
  const [pwdLabel, setPwdLabel] = useState('NOT LOOKING');

  // DOM Refs
  const sceneRef = useRef(null);
  const robotRef = useRef(null);
  const head3dRef = useRef(null);
  const eyesRef = useRef(null);
  const bubbleRef = useRef(null);
  const cardRef = useRef(null);
  const btnRef = useRef(null);
  const doneRef = useRef(false);

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    otp: '',
    username: '',
    name: '',
    classLevel: '',
    email: '',
    whatsappOptIn: true,
  });

  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const navigate = useNavigate();
  const { login } = useAuth();

  // Helper to trigger speech bubble pop animation
  const say = useCallback((text) => {
    setBubbleText(text);
    if (bubbleRef.current) {
      bubbleRef.current.classList.remove('pop');
      void bubbleRef.current.offsetWidth;
      bubbleRef.current.classList.add('pop');
    }
  }, []);

  const triggerCardShake = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.classList.remove('shake');
      void cardRef.current.offsetWidth;
      cardRef.current.classList.add('shake');
    }
  }, []);

  // Eye and head positioning
  const setLook = useCallback((x, y) => {
    if (eyesRef.current) {
      eyesRef.current.style.setProperty('--lx', `${x}px`);
      eyesRef.current.style.setProperty('--ly', `${y}px`);
    }
  }, []);

  const setTilt = useCallback((ry, rx) => {
    if (head3dRef.current) {
      head3dRef.current.style.setProperty('--ry', `${ry}deg`);
      head3dRef.current.style.setProperty('--rx', `${rx}deg`);
    }
  }, []);

  const followTyping = useCallback((length, max = 15) => {
    const ratio = Math.min(length / max, 1);
    setLook(-6 + 12 * ratio, 4);
    setTilt(-4 + 8 * ratio, -7);
  }, [setLook, setTilt]);

  // Confetti burst animation
  const fireConfetti = useCallback(() => {
    if (!btnRef.current || !sceneRef.current) return;
    const colors = ['#ff6b4b', '#2ec4b6', '#ffc53d', '#23252d', '#fffdf8'];
    const origin = btnRef.current.getBoundingClientRect();
    const host = sceneRef.current;
    const hostRect = host.getBoundingClientRect();
    const ox = origin.left - hostRect.left + origin.width / 2;
    const oy = origin.top - hostRect.top;

    for (let i = 0; i < 70; i++) {
      const bit = document.createElement('span');
      bit.className = 'robot-confetti';
      bit.style.background = colors[Math.floor(Math.random() * colors.length)];
      if (Math.random() > 0.5) bit.style.borderRadius = '50%';
      host.appendChild(bit);

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 240 + Math.random() * 380;
      const tx = Math.cos(angle) * speed;
      const ty = Math.sin(angle) * speed;

      bit.animate(
        [
          { transform: `translate(${ox}px, ${oy}px) rotate(0deg) scale(1)`, opacity: 1 },
          { transform: `translate(${ox + tx}px, ${oy + ty + 320}px) rotate(${540 * (Math.random() > 0.5 ? 1 : -1)}deg) scale(0.6)`, opacity: 0 }
        ],
        { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(0.15, 0.6, 0.35, 1)' }
      ).onfinish = () => { bit.remove(); };
    }
  }, []);

  // Blinking loop
  useEffect(() => {
    let blinkTimeout;
    const scheduleBlink = () => {
      blinkTimeout = setTimeout(() => {
        if (!isTurned && mood !== 'success' && eyesRef.current) {
          eyesRef.current.classList.add('blink');
          setTimeout(() => {
            if (eyesRef.current) eyesRef.current.classList.remove('blink');
          }, 150);
        }
        scheduleBlink();
      }, 2600 + Math.random() * 2600);
    };

    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, [isTurned, mood]);

  // Pointer movement tracking
  useEffect(() => {
    let rafId = null;
    const handleMouseMove = (e) => {
      if (doneRef.current || isTurned) return;
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT')) return;

      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!robotRef.current) return;
        const rect = robotRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 260));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 260));
        setLook(dx * 7, dy * 6);
        setTilt(dx * 12, -dy * 9);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isTurned, setLook, setTilt]);

  // Debounced username check for Step 4
  useEffect(() => {
    if (step !== 4) return;
    const value = formData.username?.trim();
    if (!value) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(value)) {
      setUsernameStatus({ checking: false, available: false, message: 'Username cannot be an email' });
      return;
    }
    setUsernameStatus((s) => ({ ...s, checking: true, message: '' }));
    const id = setTimeout(async () => {
      try {
        const { data } = await authService.checkUsername(value);
        setUsernameStatus({
          checking: false,
          available: !!data?.available,
          message: data?.available ? '✓ Username available' : '✗ Username already taken'
        });
        if (data?.available) {
          say("That username is sharp. Ready to go!");
        } else {
          say("Uh oh, someone already took that username!");
        }
      } catch (e) {
        setUsernameStatus({ checking: false, available: null, message: 'Unable to verify username' });
      }
    }, 400);
    return () => clearTimeout(id);
  }, [formData.username, step, say]);

  // OTP resend timer
  useEffect(() => {
    let interval;
    if (step === 3 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  // Password focus & strength updates
  const handlePasswordFocus = () => {
    setIsTurned(true);
    setMood('shy');
    setLook(0, 0);
    setTilt(0, 0);
    say("A secret? Say no more. *turns around*");
  };

  const handlePasswordBlur = (e) => {
    // If the focus shifted to the peek toggle button, stay turned around
    if (e.relatedTarget && e.relatedTarget.dataset?.peek) return;
    setIsTurned(false);
    setMood('idle');
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, password: val }));

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 8 && /[a-zA-Z]/.test(val)) score++;
    if (/\d/.test(val) && /[a-zA-Z]/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val) || val.length >= 10) score++;
    if (val.length > 0 && score === 0) score = 1;

    setPwdScore(score);
    const labels = ['NOT LOOKING', 'TOO SHORT', 'GETTING THERE', 'STRONG', 'FORT KNOX'];
    setPwdLabel(val.length === 0 ? 'NOT LOOKING' : labels[score]);
  };

  const handleTogglePassword = () => {
    const next = !showPassword;
    setShowPassword(next);
    if (next) {
      say("Revealing it? Good thing I'm facing the wall!");
    } else {
      say("Hidden again. Safe and sound.");
    }
  };

  // Button hover & press effects
  const handleBtnHype = (on) => {
    if (doneRef.current) return;
    setIsHyped(on);
    if (on) {
      if (!isTurned) {
        setMood('excited');
        say(step === 2 ? "Ready when you are! Press Log In." : "Let's do this! Hit Continue.");
      }
    } else {
      if (!isTurned) setMood('idle');
    }
  };

  const handleBtnPointerDown = () => {
    setIsPressed(true);
    setMood('pressed');
    say("Beep! Crunching data...");
  };

  const handleBtnPointerUp = () => {
    setIsPressed(false);
    if (!doneRef.current) {
      setMood(isTurned ? 'shy' : 'idle');
    }
  };

  // Step 1: Check Phone
  const handlePhoneCheck = async (e) => {
    e.preventDefault();
    if (formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      triggerCardShake();
      say("10 digits needed! Check your number.");
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await authService.checkUser(formData.phone);
      if (response.data.exists) {
        setUserName(response.data.name || '');
        setStep(2);
        setMood('happy');
        say(`Welcome back, ${response.data.name?.split(' ')[0] || 'friend'}! Enter your password.`);
      } else {
        await authService.sendOtp(formData.phone, 'signup');
        setStep(3);
        setResendTimer(60);
        setResendCount(0);
        setMood('watching');
        say("New around here? Sent a 6-digit WhatsApp code!");
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify number. Please try again.';
      setError(msg);
      triggerCardShake();
      say("Bzzzt! Could not verify that number.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Login Existing User
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({
        phone: formData.phone,
        password: formData.password,
        region: sessionStorage.getItem('user_region') || null,
        city: sessionStorage.getItem('user_city') || null,
        country: sessionStorage.getItem('user_country') || null
      });

      if (response.data && response.data.token) {
        doneRef.current = true;
        setIsTurned(false);
        setIsHyped(false);
        setMood('success');
        setIsSuccess(true);
        setIsSpinning(true);
        say(`Access granted! Welcome, ${userName?.split(' ')[0] || 'scholar'}!`);
        fireConfetti();

        const userClass = response?.data?.user?.classLevel ||
                          response?.data?.user?.class ||
                          localStorage.getItem("classLevel") ||
                          "unknown_class";

        window.hyTrack?.("login", {
          method: "phone_password",
          user_type: "student",
          is_new_user: false,
          source: "robot_login_page",
          "class": userClass
        });

        login(response.data);
        try { sessionStorage.setItem('entryType', 'login'); } catch (_) {}

        setTimeout(() => {
          navigate('/learn');
        }, 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Incorrect password.';
      setError(msg);
      triggerCardShake();
      say("Incorrect password! Give it another shot.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify OTP for Signup
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      triggerCardShake();
      say("I need all 6 digits to verify you!");
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authService.verifyOtp(formData.phone, formData.otp);
      setStep(4);
      setMood('happy');
      say("OTP verified! Let's set up your profile.");
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(msg);
      triggerCardShake();
      say("That OTP didn't match. Check WhatsApp!");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendCount >= 3) return;
    setIsLoading(true);
    setError('');
    try {
      await authService.sendOtp(formData.phone, 'signup');
      setResendTimer(60);
      setResendCount(prev => prev + 1);
      say("Fresh OTP sent to your WhatsApp!");
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
      triggerCardShake();
      say("Couldn't resend right now. Try in a bit.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Complete Profile & Register
  const onSubmitDetails = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.register({
        username: formData.username.trim(),
        name: formData.name,
        classLevel: formData.classLevel || null,
        phone: formData.phone || null,
        email: formData.email.trim() || null,
        password: formData.password,
        whatsappOptIn: formData.whatsappOptIn,
        region: sessionStorage.getItem('user_region') || null,
        city: sessionStorage.getItem('user_city') || null,
        country: sessionStorage.getItem('user_country') || null
      });

      if (response.data && response.data.token) {
        doneRef.current = true;
        setIsTurned(false);
        setIsHyped(false);
        setMood('success');
        setIsSuccess(true);
        setIsSpinning(true);
        say(`Account created! Welcome aboard, ${formData.name}!`);
        fireConfetti();

        const source = getSignupSource();
        const classLvl = formData.classLevel || "unknown_class";

        window.hyTrack?.("sign_up", {
          method: "phone_otp",
          user_type: "new",
          is_new_user: true,
          signup_source: source,
          "class": classLvl
        });

        setUserProperties({
          signup_source: source,
          class: classLvl,
          user_type: 'new'
        });

        try {
          if (window.NativeFB && window.NativeFB.logSignup) {
            window.NativeFB.logSignup();
          }
        } catch (_) {}

        login(response.data);
        try { sessionStorage.setItem('entryType', 'signup'); } catch (_) {}

        setTimeout(() => {
          navigate('/learn');
        }, 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(msg);
      triggerCardShake();
      say("Registration failed. Please check the fields!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="robot-scene" ref={sceneRef}>
      {/* Top Brand Header */}
      <header className="robot-header">
        <Link to="/" className="robot-logo-link">
          <img
            src={HoshiyaarLogo}
            alt="HoshiYaar Logo"
            className="h-8 md:h-10 w-auto object-contain"
          />
        </Link>
        <Link to="/" className="robot-back-btn">
          <span>←</span> Back to Home
        </Link>
      </header>

      {/* Robot + Form Stage */}
      <main className="robot-stage" data-step={step}>
        {/* Animated Robot Mascot */}
        <div
          className={`robot ${isTurned ? 'is-turned' : ''} ${isHyped ? 'is-hyped' : ''} ${isPressed ? 'is-pressed' : ''} ${isSpinning ? 'is-spinning' : ''}`}
          ref={robotRef}
          data-mood={mood}
        >
          {/* Speech Bubble */}
          <div className="bubble" ref={bubbleRef} role="status" aria-live="polite">
            <span>{bubbleText}</span>
          </div>

          {/* Antenna */}
          <div className="antenna" aria-hidden="true">
            <span className="antenna-rod"></span>
            <span className="antenna-tip"></span>
          </div>

          {/* 3D Tilting Head */}
          <div className="head3d" ref={head3dRef} aria-hidden="true">
            <div className="head">
              <span className="ear ear--l"></span>
              <span className="ear ear--r"></span>

              {/* Front Face */}
              <div className="face face--front">
                <div className="visor">
                  <div className="eyes" ref={eyesRef}>
                    <span className="eye eye--l"></span>
                    <span className="eye eye--r"></span>
                  </div>
                  <span className="cheek cheek--l"></span>
                  <span className="cheek cheek--r"></span>
                  <span className="mouth"></span>
                </div>
              </div>

              {/* Back Face (Privacy Panel & Password Meter) */}
              <div className="face face--back">
                <div className="panel">
                  <span className="panel-lights">
                    <i></i><i></i><i></i>
                  </span>
                  <div className="meter" data-lvl={pwdScore}>
                    <i></i><i></i><i></i><i></i>
                  </div>
                  <p className="panel-label">{pwdLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Form */}
        <div className={`robot-card ${step === 4 ? 'robot-card--step4' : 'robot-card--spacious'}`} ref={cardRef}>
          {/* Robot Hands Resting on Card Rim */}
          <span className="hand hand--l" aria-hidden="true"></span>
          <span className="hand hand--r" aria-hidden="true"></span>

          {/* Error Notice */}
          {error && (
            <div className="robot-alert">
              {error}
            </div>
          )}

          {/* ================= STEP 1: Phone Number ================= */}
          {step === 1 && (
            <div>
              <h1 className="robot-card-title">Who goes there?</h1>
              <p className="robot-card-subtitle">Enter your 10-digit mobile number</p>

              <form onSubmit={handlePhoneCheck}>
                <label className="field-label">Mobile Number</label>
                <div className="field">
                  {/* Phone Icon */}
                  <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    placeholder="10-digit mobile number"
                    autoComplete="tel"
                    required
                    maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData(prev => ({ ...prev, phone: val }));
                      followTyping(val.length, 10);
                      if (val.length === 10) {
                        setMood('happy');
                        say("10 digits locked in! Hit Continue.");
                      }
                    }}
                    onFocus={() => {
                      setIsTurned(false);
                      setMood('watching');
                      say("State your number. I guard this gate.");
                    }}
                  />
                </div>

                <button
                  ref={btnRef}
                  type="submit"
                  disabled={isLoading || formData.phone.length !== 10}
                  className={`btn ${isSuccess ? 'is-success' : ''}`}
                  onMouseEnter={() => handleBtnHype(true)}
                  onMouseLeave={() => handleBtnHype(false)}
                  onFocus={() => handleBtnHype(true)}
                  onBlur={() => handleBtnHype(false)}
                  onPointerDown={handleBtnPointerDown}
                  onPointerUp={handleBtnPointerUp}
                >
                  <span className="btn-bolt" aria-hidden="true">⚡</span>
                  <span>{isLoading ? 'VERIFYING...' : 'CONTINUE'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 2: Password Login (Existing User) ================= */}
          {step === 2 && (
            <div>
              <h1 className="robot-card-title">
                Welcome back, {userName ? userName.split(' ')[0] : 'friend'}!
              </h1>
              <p className="robot-card-subtitle">
                Logging in as <strong>{formData.phone}</strong>{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsTurned(false);
                    setMood('idle');
                    setStep(1);
                  }}
                  className="text-blue-600 font-bold underline hover:text-blue-800 ml-1 text-xs cursor-pointer bg-transparent border-none p-0"
                >
                  (Change)
                </button>
              </p>

              <form onSubmit={handleLogin}>
                <div className="flex justify-between items-center mb-1.5 ml-0.5">
                  <label className="field-label" style={{ margin: 0 }}>Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="field">
                  {/* Lock Icon */}
                  <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.7V19h-2v-1.3a2 2 0 0 1 1-3.7Z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    onChange={handlePasswordChange}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                  />
                  <button
                    data-peek="true"
                    className="peek"
                    type="button"
                    onClick={handleTogglePassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    tabIndex="-1"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 5c-5 0-9.3 3.1-11 7.5C2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5Zm0 12.5a5 5 0 1 1 5-5 5 5 0 0 1-5 5Zm0-8a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" />
                    </svg>
                  </button>
                </div>

                <button
                  ref={btnRef}
                  type="submit"
                  disabled={isLoading || !formData.password}
                  className={`btn ${isSuccess ? 'is-success' : ''}`}
                  onMouseEnter={() => handleBtnHype(true)}
                  onMouseLeave={() => handleBtnHype(false)}
                  onFocus={() => handleBtnHype(true)}
                  onBlur={() => handleBtnHype(false)}
                  onPointerDown={handleBtnPointerDown}
                  onPointerUp={handleBtnPointerUp}
                >
                  <span className="btn-bolt" aria-hidden="true">⚡</span>
                  <span>{isLoading ? 'LOGGING IN...' : isSuccess ? 'ACCESS GRANTED ✓' : 'LOG ME IN'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 3: WhatsApp OTP (New User) ================= */}
          {step === 3 && (
            <div>
              {/* WhatsApp Badge */}
              <div className="robot-whatsapp-banner">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                  <span className="font-extrabold text-sm text-green-900">Check Your WhatsApp</span>
                </div>
                <div className="text-xs text-green-800">
                  Code sent to <strong>{formData.phone}</strong>{' '}
                  <button
                    type="button"
                    onClick={() => { setStep(1); setMood('idle'); }}
                    className="text-blue-700 underline font-bold"
                  >
                    (Change)
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp}>
                <label className="field-label">6-Digit Verification Code</label>
                <div className="field">
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: 800 }}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setFormData(prev => ({ ...prev, otp: val }));
                      followTyping(val.length, 6);
                      if (val.length === 6) {
                        setMood('happy');
                        say("Full code entered! Press Verify.");
                      }
                    }}
                    onFocus={() => {
                      setIsTurned(false);
                      setMood('watching');
                      say("Check your phone WhatsApp app for the 6-digit code!");
                    }}
                  />
                </div>

                <button
                  ref={btnRef}
                  type="submit"
                  disabled={isLoading || formData.otp.length !== 6}
                  className={`btn ${isSuccess ? 'is-success' : ''}`}
                  onMouseEnter={() => handleBtnHype(true)}
                  onMouseLeave={() => handleBtnHype(false)}
                  onFocus={() => handleBtnHype(true)}
                  onBlur={() => handleBtnHype(false)}
                  onPointerDown={handleBtnPointerDown}
                  onPointerUp={handleBtnPointerUp}
                >
                  <span className="btn-bolt" aria-hidden="true">⚡</span>
                  <span>{isLoading ? 'VERIFYING...' : 'VERIFY OTP'}</span>
                </button>
              </form>

              {/* Resend Link */}
              <div className="mt-4 text-center">
                {resendTimer > 0 ? (
                  <p className="text-xs font-semibold text-slate-500">
                    Resend code in <span className="text-blue-600 font-bold">{resendTimer}s</span>
                  </p>
                ) : resendCount >= 3 ? (
                  <p className="text-xs text-red-500 font-medium">Too many attempts. Please try again later.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer bg-transparent border-none"
                  >
                    Didn't receive code? Resend
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 4: Complete Profile (New User) ================= */}
          {step === 4 && (
            <div>
              <h1 className="robot-card-title">Almost There!</h1>
              <p className="robot-card-subtitle">Set up your student profile</p>

              <form onSubmit={onSubmitDetails}>
                {/* Row 1: Full Name & Username */}
                <div className="grid grid-cols-2 gap-2 mb-1.5">
                  <div>
                    <label className="field-label">Full Name</label>
                    <div className="field">
                      <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-3.9 0-8 2-8 5v1.5h16V19c0-3-4.1-5-8-5Z"/>
                      </svg>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        placeholder="Your name"
                        autoComplete="name"
                        required
                        onChange={(e) => {
                          onChange(e);
                          followTyping(e.target.value.length, 20);
                          if (e.target.value.trim().length >= 2) {
                            say(`${e.target.value.trim()}. Filed forever!`);
                          }
                        }}
                        onFocus={() => {
                          setIsTurned(false);
                          setMood('watching');
                          say("State your name. I'll remember it!");
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Username</label>
                    <div className="field">
                      <span className="field-icon font-bold text-slate-400 text-xs">@</span>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        placeholder="Unique handle"
                        required
                        onChange={(e) => {
                          onChange(e);
                          followTyping(e.target.value.length, 15);
                        }}
                        onFocus={() => {
                          setIsTurned(false);
                          setMood('watching');
                          say("Pick a unique handle for leaderboards!");
                        }}
                      />
                    </div>
                    {usernameStatus.message && (
                      <p className={`text-[9.5px] -mt-1 mb-1 ml-0.5 font-bold ${usernameStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                        {usernameStatus.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Class & Email */}
                <div className="grid grid-cols-2 gap-2 mb-1.5">
                  <div>
                    <label className="field-label">Class</label>
                    <div className="field">
                      <select
                        name="classLevel"
                        value={formData.classLevel}
                        onChange={onChange}
                        required
                        className="cursor-pointer"
                        onFocus={() => {
                          setIsTurned(false);
                          setMood('watching');
                          say("Which grade are you conquering?");
                        }}
                      >
                        <option value="" disabled>Class</option>
                        <option value="6">Class 6</option>
                        <option value="7">Class 7</option>
                        <option value="8">Class 8</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Email (Optional)</label>
                    <div className="field">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        placeholder="Email"
                        onChange={onChange}
                        onFocus={() => {
                          setIsTurned(false);
                          setMood('watching');
                          say("No spam — I don't even have an inbox!");
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Set Password */}
                <div className="mb-1.5">
                  <label className="field-label">Set Password</label>
                  <div className="field">
                    <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 0 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.7V19h-2v-1.3a2 2 0 0 1 1-3.7Z" />
                    </svg>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      onChange={handlePasswordChange}
                      onFocus={handlePasswordFocus}
                      onBlur={handlePasswordBlur}
                    />
                    <button
                      data-peek="true"
                      className="peek"
                      type="button"
                      onClick={handleTogglePassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      tabIndex="-1"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 5c-5 0-9.3 3.1-11 7.5C2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5Zm0 12.5a5 5 0 1 1 5-5 5 5 0 0 1-5 5Zm0-8a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button
                  ref={btnRef}
                  type="submit"
                  disabled={isLoading || usernameStatus.available === false || !formData.classLevel}
                  className={`btn ${isSuccess ? 'is-success' : ''}`}
                  onMouseEnter={() => handleBtnHype(true)}
                  onMouseLeave={() => handleBtnHype(false)}
                  onFocus={() => handleBtnHype(true)}
                  onBlur={() => handleBtnHype(false)}
                  onPointerDown={handleBtnPointerDown}
                  onPointerUp={handleBtnPointerUp}
                >
                  <span className="btn-bolt" aria-hidden="true">⚡</span>
                  <span>{isLoading ? 'CREATING...' : isSuccess ? 'WELCOME ABOARD ✓' : 'COMPLETE SIGN UP'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Feet Anchored at Bottom */}
          <span className="foot foot--l" aria-hidden="true"></span>
          <span className="foot foot--r" aria-hidden="true"></span>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] font-semibold text-slate-500 mt-6 text-center max-w-xs">
          By continuing, you agree to our{' '}
          <span className="text-slate-800 underline cursor-pointer">Terms of Service</span> and{' '}
          <span className="text-slate-800 underline cursor-pointer">Privacy Policy</span>.
        </p>
      </main>
    </div>
  );
};

export default UnifiedAuth;
