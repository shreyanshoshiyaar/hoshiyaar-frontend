import { useAuth } from '../context/AuthContext.jsx';
import { useAccess } from '../context/AccessContext.jsx';
import { isUserAdmin } from '../utils/adminCheck.js';

// The Pro page is linked only once the trial applies to the learner (or for admins),
// so students never see plans before the trial is switched on
export function useShowPro() {
  const { user } = useAuth();
  const { access } = useAccess();
  return Boolean(import.meta.env.DEV || isUserAdmin(user) || (access && access.state !== 'open'));
}
