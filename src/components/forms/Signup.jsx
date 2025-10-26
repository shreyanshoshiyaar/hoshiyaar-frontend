import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import authService from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.jsx';

const Signup = () => {
  const [step, setStep] = useState(1); // 1: age, 2: profile
  const [formData, setFormData] = useState({
    age: '',
    username: '',
    name: '',
    dateOfBirth: '',
    classLevel: '',
  });
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Debounced username availability check
  useEffect(() => {
    const value = formData.username?.trim();
    if (!value) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }
    setUsernameStatus((s) => ({ ...s, checking: true, message: '' }));
    const id = setTimeout(async () => {
      try {
        const { data } = await authService.checkUsername(value);
        setUsernameStatus({ checking: false, available: !!data?.available, message: data?.available ? 'Username available' : 'Username already taken' });
      } catch (e) {
        setUsernameStatus({ checking: false, available: null, message: 'Unable to verify username' });
      }
    }, 400);
    return () => clearTimeout(id);
  }, [formData.username]);

  const handleNext = () => {
    if (!formData.age) return;
    setStep(2);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authService.register({
        username: formData.username.trim(),
        name: formData.name,
        age: Number(formData.age),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
        classLevel: formData.classLevel || null,
      });
      if (response.data && response.data.token) {
        login(response.data);
        try {
          sessionStorage.setItem('entryType', 'signup');
          const uid = response.data?._id;
          if (uid) {
            const localKey = `learnOnboarded_${uid}`;
            const sessionKey = `learnWasOnDashboard_${uid}`;
            try { localStorage.removeItem(localKey); } catch (_) {}
            try { sessionStorage.removeItem(sessionKey); } catch (_) {}
          }
        } catch (_) {}
        navigate('/learn');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

    return (
    <AuthLayout title="Sign up" linkTo="/login" linkText="Log in">
      <div className="text-center w-full max-w-sm sm:max-w-md">
        {step === 1 ? (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">How old are you?</h1>
            {error && <p className="bg-red-500 text-white p-3 rounded-md mb-4 text-sm sm:text-base text-overflow-fix">{error}</p>}
            <div className="space-y-3 sm:space-y-4">
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={onChange}
                placeholder="Age"
                className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base"
              />
              <p className="text-xs sm:text-sm text-gray-400 text-left text-overflow-fix">
                Providing your age helps us tailor the right learning experience. For more
                details, please see our <span className="text-duo-blue font-bold">Privacy Policy</span>.
              </p>
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.age}
                className="w-full bg-[#1E65FA] text-gray-300 disabled:cursor-not-allowed font-bold uppercase tracking-wider py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-blue-500' transition btn-responsive"
              >
                Next
                        </button>
                        </div>
                    </div>
        ) : (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Create your profile</h1>
            {error && <p className="bg-red-500 text-white p-3 rounded-md mb-4 text-sm sm:text-base text-overflow-fix">{error}</p>}
            <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={onChange}
                placeholder="Username (unique)"
                className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base"
                required
              />
              {usernameStatus.message && (
                <p aria-live="polite" className={`text-xs text-left ${usernameStatus.available ? 'text-green-400' : 'text-red-400'}`}>
                  {usernameStatus.message}
                </p>
              )}
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                placeholder="Name"
                className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="text-left">
                  <label className="text-xs sm:text-sm text-gray-300 mb-2 block">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={onChange}
                    placeholder="Date of Birth"
                    className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base"
                    required
                  />
                </div>
                <div className="text-left">
                  <label className="text-xs sm:text-sm text-gray-300 mb-2 block">Class</label>
                  <select
                    name="classLevel"
                    value={formData.classLevel}
                    onChange={onChange}
                    className="w-full bg-[#3c3c3c] border-2 border-[#585858] rounded-xl sm:rounded-2xl p-3 sm:p-4 focus:outline-none focus:border-duo-blue text-sm sm:text-base text-white"
                  >
                    <option value="" disabled>Select class</option>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={usernameStatus.available === false || usernameStatus.checking}
                className={`w-full text-white font-bold uppercase tracking-wider py-3 sm:py-4 rounded-xl sm:rounded-2xl border-b-4 transition text-sm sm:text-base btn-responsive ${usernameStatus.available === false || usernameStatus.checking ? 'bg-gray-500 border-gray-600 cursor-not-allowed' : 'bg-duo-blue border-duo-blue-dark hover:bg-blue-500'}`}
              >
                Create Account
                    </button>
              <p className="text-xs sm:text-sm text-gray-400 text-left text-overflow-fix">
                By creating an account, you agree to our <span className="text-duo-blue font-bold">Terms</span>
                &nbsp;and <span className="text-duo-blue font-bold">Privacy Policy</span>.
              </p>
            </form>
                </div>
        )}
                            </div>
    </AuthLayout>
  );
};

export default Signup;