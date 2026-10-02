/**
 * Central admin & subscription visibility evaluator
 */

export const isUserAdmin = (user) => {
  if (!user) {
    return sessionStorage.getItem('isAdmin') === 'true';
  }

  if (user.role === 'admin' || user.role === 'master') {
    return true;
  }

  if (sessionStorage.getItem('isAdmin') === 'true') {
    return true;
  }

  const cleanPhone = String(user.phone || '').replace(/\D/g, '');
  const adminPhones = ['9867735936', '7021970672', '9820277252', '8310532323'];
  if (adminPhones.some(p => cleanPhone.endsWith(p))) {
    return true;
  }

  const adminUsernames = ['Host', 'hostcbse', 'AKSHITRAVULA', 'AKSHIT', 'SB10', 'Nidhi sekhri'];
  if (user.username && adminUsernames.includes(user.username)) {
    return true;
  }

  return false;
};

/**
 * Checks if subscription UI, pricing, and Pro elements should be displayed
 * Default mode is 'admin_only', meaning regular students see zero subscription UI
 */
export const shouldShowSubscriptionUI = (user, subscriptionMode = 'admin_only') => {
  if (subscriptionMode === 'disabled') {
    return false;
  }
  if (subscriptionMode === 'live') {
    return true;
  }
  // 'admin_only' mode: strictly visible to admins only
  return isUserAdmin(user);
};
