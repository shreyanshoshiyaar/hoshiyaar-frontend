import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import paymentService from '../../../services/paymentService.js';

export default function PaywallModal({
  isOpen,
  onClose,
  onSuccess,
  moduleId,
  moduleTitle = 'Lesson',
  variant = 'hybrid',
  plans = [],
  mockMode = false,
  razorpayKeyId = ''
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loadingCode, setLoadingCode] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [billingCycle, setBillingCycle] = useState('annual'); // 'annual' | 'monthly'
  const [fetchedPlans, setFetchedPlans] = useState(plans);

  useEffect(() => {
    if (!plans || plans.length === 0) {
      paymentService.getPublicConfig().then(cfg => {
        if (cfg?.plans?.length) setFetchedPlans(cfg.plans);
      }).catch(() => {});
    } else {
      setFetchedPlans(plans);
    }
  }, [plans]);

  if (!isOpen) return null;

  const activePlans = fetchedPlans && fetchedPlans.length > 0 ? fetchedPlans : plans;

  const annualPlan = activePlans.find((p) => p.code === 'annual_pass' || p.billingCycle === 'annual') || {
    code: 'annual_pass',
    name: 'Annual Unlimited Pass',
    amount: 1999,
    discountedFrom: 3588,
    billingCycle: 'annual'
  };

  const monthlyPlan = activePlans.find((p) => p.code === 'monthly_pass' || (p.type === 'subscription' && p.billingCycle === 'monthly')) || {
    code: 'monthly_pass',
    name: 'Monthly Unlimited Pass',
    amount: 299,
    discountedFrom: 499,
    billingCycle: 'monthly'
  };

  const perLessonPlan = activePlans.find((p) => p.type === 'pay_per_lesson') || {
    code: 'pay_per_lesson',
    name: 'Unlock This Lesson',
    amount: 19,
    discountedFrom: 29,
    type: 'pay_per_lesson'
  };

  const handlePay = async (plan) => {
    setErrorMsg('');
    setLoadingCode(plan.code);

    try {
      // 1. Create order
      const orderData = await paymentService.createOrder({
        planCode: plan.code,
        moduleId: plan.type === 'pay_per_lesson' ? moduleId : undefined
      });

      // 2. Mock mode instant checkout
      if (orderData.mockMode) {
        const mockRes = await paymentService.mockSuccessPayment({
          planCode: plan.code,
          moduleId: plan.type === 'pay_per_lesson' ? moduleId : undefined
        });

        if (mockRes.success) {
          onSuccess?.();
          onClose?.();
        } else {
          setErrorMsg(mockRes.message || 'Mock payment simulation failed.');
        }
        setLoadingCode(null);
        return;
      }

      // 3. Real Razorpay modal
      const isLoaded = await paymentService.loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load payment gateway. Please check your connection.');
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.keyId;

      const options = {
        key: razorpayKey,
        amount: orderData.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'Hoshiyaar Learning',
        description: plan.name,
        order_id: orderData.order_id || orderData.orderId,
        prefill: {
          name: user?.username || '',
          contact: user?.phone || '',
          email: user?.email || ''
        },
        theme: {
          color: '#2563EB'
        },
        handler: async (response) => {
          try {
            const verifyRes = await paymentService.verifyPayment({
              orderId: response.razorpay_order_id,
              order_id: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planCode: plan.code,
              moduleId: plan.type === 'pay_per_lesson' ? moduleId : undefined
            });

            if (verifyRes.success) {
              onSuccess?.();
              onClose?.();
            } else {
              setErrorMsg(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Payment verification error.');
          } finally {
            setLoadingCode(null);
          }
        },
        modal: {
          ondismiss: () => {
            setLoadingCode(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('[Razorpay] Payment failed:', response?.error);
        setErrorMsg(response?.error?.description || response?.error?.reason || 'Payment failed. Please try again.');
        setLoadingCode(null);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Payment failed to initiate.');
      setLoadingCode(null);
    }
  };

  const showMonthlyOnly = variant === 'monthly_only';
  const showLessonOnly = variant === 'pay_per_lesson_only';
  const showBoth = !showMonthlyOnly && !showLessonOnly;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl relative border border-gray-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm transition-colors z-10"
        >
          ✕
        </button>

        {/* Header Badge */}
        <div className="text-center mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1.5 text-xl shadow-inner">
            🔒
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block mb-1">
            Lesson Locked
          </span>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-snug line-clamp-1 px-4">
            Unlock {moduleTitle}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">
            First lesson is free! Select an option below to continue learning.
          </p>
        </div>

        {/* Mock Sandbox Notice */}
        {mockMode && (
          <div className="mb-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <span>🧪 <strong>Sandbox Active</strong>: 1-click test checkout</span>
            <span className="bg-amber-200 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">TEST</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-2.5 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Billing Toggle Switch */}
        {(showBoth || showMonthlyOnly) && (
          <div className="flex bg-gray-100 p-1 rounded-xl mb-2.5 border border-gray-200/80">
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>⭐ Annual Pass</span>
              <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full ${
                billingCycle === 'annual' ? 'bg-amber-400 text-amber-950' : 'bg-green-100 text-green-800'
              }`}>
                Save 45%
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly (₹299)
            </button>
          </div>
        )}

        {/* Option Choices */}
        <div className="space-y-2 mb-3">
          {/* Unlimited Pass Choice (Annual or Monthly according to toggle) */}
          {(showBoth || showMonthlyOnly) && (
            billingCycle === 'annual' ? (
              <div className="p-3 rounded-2xl border-2 border-indigo-500 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 relative shadow-xs animate-fade-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-gray-900 text-xs sm:text-sm">
                    Annual Unlimited Pass
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                    Save 45% • Best Value
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mb-2 leading-tight">
                  Full <strong>1 Year</strong> unlimited access to all chapters, AI explanations & revisions.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-gray-900">₹{annualPlan.amount}</span>
                    <span className="text-[11px] text-gray-500">/ yr</span>
                    {annualPlan.discountedFrom > annualPlan.amount && (
                      <span className="text-[11px] text-gray-400 line-through">₹{annualPlan.discountedFrom}</span>
                    )}
                  </div>
                  <button
                    disabled={loadingCode === annualPlan.code}
                    onClick={() => handlePay(annualPlan)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition-transform active:scale-95 shadow-sm flex items-center gap-1"
                  >
                    {loadingCode === annualPlan.code ? 'Starting...' : 'Get 1-Yr Pass'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl border-2 border-blue-400 bg-blue-50/50 relative shadow-xs animate-fade-in">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-gray-900 text-xs sm:text-sm">
                    Monthly Unlimited Pass
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                    30 Days
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mb-2 leading-tight">
                  Unlimited access to all chapters & AI feedback for 30 days. Cancel anytime.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-gray-900">₹{monthlyPlan.amount}</span>
                    <span className="text-[11px] text-gray-500">/ mo</span>
                    {monthlyPlan.discountedFrom > monthlyPlan.amount && (
                      <span className="text-[11px] text-gray-400 line-through">₹{monthlyPlan.discountedFrom}</span>
                    )}
                  </div>
                  <button
                    disabled={loadingCode === monthlyPlan.code}
                    onClick={() => handlePay(monthlyPlan)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-transform active:scale-95 shadow-xs"
                  >
                    {loadingCode === monthlyPlan.code ? 'Starting...' : 'Get Pass'}
                  </button>
                </div>
              </div>
            )
          )}

          {/* Option 2: Single Lesson Pass */}
          {(showBoth || showLessonOnly) && (
            <div className="p-2.5 sm:p-3 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-all">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-gray-800 text-xs sm:text-sm">
                  Unlock This Lesson Only
                </span>
                <span className="text-[10px] font-semibold text-gray-500">
                  Lifetime
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mb-1.5 leading-tight">
                Permanent unlock for this specific lesson and quizzes.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-gray-800">₹{perLessonPlan.amount}</span>
                  {perLessonPlan.discountedFrom > perLessonPlan.amount && (
                    <span className="text-[11px] text-gray-400 line-through">₹{perLessonPlan.discountedFrom}</span>
                  )}
                </div>
                <button
                  disabled={loadingCode === perLessonPlan.code}
                  onClick={() => handlePay(perLessonPlan)}
                  className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-transform active:scale-95 shadow-xs"
                >
                  {loadingCode === perLessonPlan.code ? 'Unlocking...' : `Unlock for ₹${perLessonPlan.amount}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Link to Dedicated Subscription Page */}
        <div className="text-center pt-1.5 border-t border-gray-100">
          <button
            onClick={() => {
              onClose?.();
              navigate('/subscription');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 transition-colors"
          >
            <span>Compare all VIP plans & details</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
