import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAccess } from '../../context/AccessContext.jsx';
import api from '../../services/apiClient.js';
import { clarityTag, clarityUserId } from '../../utils/clarity.js';

// Tells Clarity who the session belongs to, so Nidhi can split the data: the internal user id, grade,
// school or self-study, and free / trial / paid. No name, phone or email.
const planOf = (state) => {
  if (state === 'pass') return 'paid';
  if (['trial_active', 'trial_not_started', 'guest_limit'].includes(state)) return 'trial';
  return 'free';
};
const gradeOf = (user) => String(user?.classLevel || user?.classTitle || '').replace(/\D/g, '') || '';

export default function ClarityIdentity() {
  const { user } = useAuth();
  const { access } = useAccess();
  const schoolChecked = useRef('');

  useEffect(() => {
    if (!user?._id) return;
    clarityUserId(user._id);
    clarityTag('grade', gradeOf(user));
    // School users are in a teacher's classroom; checked once per account per app session
    if (schoolChecked.current === String(user._id) || user.isGuest) {
      if (user.isGuest) clarityTag('user_type', 'self');
      return;
    }
    schoolChecked.current = String(user._id);
    api.get('/api/student/classrooms')
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.classrooms || res?.data?.data || []);
        clarityTag('user_type', list.length > 0 ? 'school' : 'self');
      })
      .catch(() => {});
  }, [user?._id, user?.classLevel, user?.isGuest]);

  useEffect(() => {
    if (user?._id && access?.state) clarityTag('plan', planOf(access.state));
  }, [user?._id, access?.state]);

  return null;
}
