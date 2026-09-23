import { api } from './apiClient.js';

export const paymentService = {
  /**
   * Get public payment configuration & active plans
   */
  async getPublicConfig() {
    const res = await api.get('/api/payments/config');
    return res.data;
  },

  /**
   * Central gatekeeper check: verifies if current user can access a specific module
   */
  async checkAccess(moduleId) {
    try {
      const previewMode = localStorage.getItem('admin_view_mode') || 'admin';
      const headers = previewMode === 'student' ? { 'x-admin-preview-mode': 'student' } : {};
      const res = await api.post('/api/payments/check-access', { moduleId, previewMode }, { headers });
      return res.data;
    } catch (err) {
      // If error or unauthenticated, fallback safely
      return {
        hasAccess: true, // Fail open to avoid blocking students if network error
        reason: 'network_fallback',
        error: err.message
      };
    }
  },

  /**
   * Fetches current student's subscription and trial status
   */
  async getUserStatus() {
    const previewMode = localStorage.getItem('admin_view_mode') || 'admin';
    const headers = previewMode === 'student' ? { 'x-admin-preview-mode': 'student' } : {};
    const res = await api.get('/api/payments/user-status', { headers });
    return res.data;
  },

  /**
   * Initiates Razorpay order creation
   */
  async createOrder(params) {
    const res = await api.post('/api/payments/create-order', params);
    return res.data;
  },

  /**
   * Verifies Razorpay payment signature
   */
  async verifyPayment(params) {
    const orderId = params.orderId || params.order_id || params.razorpay_order_id;
    const paymentId = params.paymentId || params.payment_id || params.razorpay_payment_id;
    const signature = params.signature || params.razorpay_signature;

    const res = await api.post('/api/payments/verify-payment', {
      orderId,
      order_id: orderId,
      razorpay_order_id: orderId,
      paymentId,
      payment_id: paymentId,
      razorpay_payment_id: paymentId,
      signature,
      razorpay_signature: signature,
      planCode: params.planCode,
      moduleId: params.moduleId,
      moduleIds: params.moduleIds
    });
    return res.data;
  },

  /**
   * Dynamically loads Razorpay checkout script if not already in window
   */
  loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * 1-Click Sandbox Test payment for local testing
   */
  async mockSuccessPayment({ planCode, moduleId, moduleIds }) {
    const res = await api.post('/api/payments/mock-success', { planCode, moduleId, moduleIds });
    return res.data;
  },

  /**
   * Cancel subscription pass
   */
  async cancelSubscription(reason = '') {
    const res = await api.post('/api/payments/cancel-subscription', { reason });
    return res.data;
  },

  /**
   * Reactivate a canceled subscription pass before period ends
   */
  async reactivateSubscription() {
    const res = await api.post('/api/payments/reactivate-subscription');
    return res.data;
  },

  /**
   * Admin: Get payment rules, A/B testing splits, and financial analytics
   */
  async getAdminSettings() {
    const res = await api.get('/api/payments/admin/settings');
    return res.data;
  },

  /**
   * Admin: Update payment rules, trial days, and A/B test splits
   */
  async updateAdminSettings(data) {
    const res = await api.put('/api/payments/admin/settings', data);
    return res.data;
  },

  /**
   * Admin: Save or update subscription plan
   */
  async savePlan(planData) {
    const res = await api.post('/api/payments/admin/plans', planData);
    return res.data;
  },

  /**
   * Admin: Fetch transactions list with pagination and search
   */
  async getAdminTransactions(params = {}) {
    const res = await api.get('/api/payments/admin/transactions', { params });
    return res.data;
  },

  /**
   * Admin: Fetch subscriptions
   */
  async getAdminSubscriptions(params = {}) {
    const res = await api.get('/api/payments/admin/subscriptions', { params });
    return res.data;
  }
};

export default paymentService;
