import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import paymentService from '../../../services/paymentService.js';
import SimpleLoading from '../../ui/SimpleLoading.jsx';
import LessonUnlockModal from './LessonUnlockModal.jsx';
import Footer from '../../layout/Footer.jsx';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/home', { replace: true });
    }
  };

  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [config, setConfig] = useState(null);
  const [processingPlanCode, setProcessingPlanCode] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [billingCycle, setBillingCycle] = useState('annual'); // 'annual' | 'monthly' | 'all'

  useEffect(() => {
    loadData(true);

    const handleModeChange = () => {
      loadData();
    };
    window.addEventListener('adminViewModeChanged', handleModeChange);
    return () => window.removeEventListener('adminViewModeChanged', handleModeChange);
  }, []);

  const handleCancelSubscription = async () => {
    setCanceling(true);
    setErrorMessage('');
    try {
      const res = await paymentService.cancelSubscription(cancelReason);
      setSuccessMessage(res.message || 'Subscription canceled. Access remains active until billing period ends.');
      setShowCancelModal(false);
      setCancelReason('');
      await loadData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to cancel subscription.');
    } finally {
      setCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setReactivating(true);
    setErrorMessage('');
    try {
      const res = await paymentService.reactivateSubscription();
      setSuccessMessage(res.message || 'Subscription reactivated successfully!');
      await loadData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to reactivate subscription.');
    } finally {
      setReactivating(false);
    }
  };

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [statusRes, configRes] = await Promise.all([
        paymentService.getUserStatus().catch(() => null),
        paymentService.getPublicConfig().catch(() => null)
      ]);

      if (statusRes) setUserStatus(statusRes);
      if (configRes) {
        setConfig(configRes);
        setPlans(configRes.plans || []);
      }
    } catch (err) {
      console.error('Error loading subscription info:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleCheckout = async (plan) => {
    // If user clicked Pay Per Chapter or Single Lesson Pass, open Chapter Selector modal
    if (plan.type === 'pay_per_chapter' || plan.code === 'pay_per_chapter' || plan.type === 'pay_per_lesson' || plan.code === 'pay_per_lesson') {
      setShowLessonSelector(true);
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setProcessingPlanCode(plan.code);

    try {
      // 1. Create order
      const orderData = await paymentService.createOrder({
        planCode: plan.code
      });

      // 2. If in Mock / Sandbox Mode, simulate instant completion or prompt
      if (orderData.mockMode) {
        const mockRes = await paymentService.mockSuccessPayment({
          planCode: plan.code
        });
        if (mockRes.success) {
          setSuccessMessage(mockRes.message || 'Payment simulated successfully in Test Sandbox!');
          await loadData();
        }
        setProcessingPlanCode(null);
        return;
      }

      // 3. Live Razorpay SDK checkout
      const isLoaded = await paymentService.loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load Razorpay gateway. Please check your internet connection.');
      }

      const razorpayKey = orderData.keyId;


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
          color: '#2563EB' // Royal Blue
        },
        handler: async (response) => {
          try {
            const verifyRes = await paymentService.verifyPayment({
              orderId: response.razorpay_order_id,
              order_id: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planCode: plan.code
            });

            if (verifyRes.success) {
              setSuccessMessage(verifyRes.message || 'Payment successful! Subscription active.');
              await loadData();
            } else {
              setErrorMessage(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Verification failed. Please contact support.');
          } finally {
            setProcessingPlanCode(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanCode(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('[Razorpay] Payment failed:', response?.error);
        setErrorMessage(response?.error?.description || response?.error?.reason || 'Payment failed. Please try again.');
        setProcessingPlanCode(null);
      });
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to initiate checkout.');
      setProcessingPlanCode(null);
    }
  };

  const perChapterPrice = config?.defaultChapterPrice || 50;
  const perLessonPrice = config?.defaultLessonPrice || 50;

  const perChapterPlan = plans.find((p) => p.type === 'pay_per_chapter' || p.code === 'pay_per_chapter') || {
    code: 'pay_per_chapter',
    name: 'Pay Per Chapter (1-Year Pass)',
    description: '1-Year unlimited access to all lessons & Chapter Exam Mode for any selected chapter',
    amount: perChapterPrice,
    discountedFrom: 99,
    type: 'pay_per_chapter',
    billingCycle: 'per_chapter',
    badge: 'BEST VALUE',
    features: [
      '1 Year full access to all lessons in the chapter',
      'Chapter Exam Mode with AI descriptive evaluation & scoring',
      'Detailed question-by-question review & performance analytics',
      'First level in every chapter free to preview',
      'Zero recurring charges — pay only ₹50 per chapter'
    ]
  };

  const perLessonPlan = plans.find((p) => p.type === 'pay_per_lesson' || p.code === 'pay_per_lesson') || {
    code: 'pay_per_lesson',
    name: 'Single Lesson Pass',
    amount: perLessonPrice,
    type: 'pay_per_lesson'
  };

  const displayedPlans = React.useMemo(() => {
    return [perChapterPlan];
  }, [perChapterPlan]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isCanceled = Boolean(userStatus?.cancelAtPeriodEnd || userStatus?.status === 'canceled');
  const isSubscribed = Boolean(
    (userStatus?.status === 'active_subscription' || isCanceled) && 
    userStatus?.currentPeriodEnd && 
    new Date(userStatus?.currentPeriodEnd) > new Date()
  );
  const isTrialActive = Boolean(userStatus?.isTrialActive && !isSubscribed);
  const trialDaysRemaining = userStatus?.trialDaysRemaining ?? 30;

  if (loading) {
    return <SimpleLoading text="Loading subscription plans..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 font-sans flex flex-col justify-between">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-semibold text-sm transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Hoshiyaar Pro
            </span>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 sm:pt-10 pb-16 w-full flex-1">

        {/* Success / Error Alerts */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-300 text-green-800 rounded-2xl p-4 flex items-center justify-between animate-fade-in text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎉</span>
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800 font-bold">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-800 rounded-2xl p-4 flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')} className="text-red-600 hover:text-red-800 font-bold">✕</button>
          </div>
        )}

        {/* Desktop 2-Column Hero Section: Left = Heading & Value Props, Right = Plan Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
          {/* Left Column: Text & Value Propositions */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold uppercase tracking-wider mb-4">
              <span>💎 UPGRADE YOUR LEARNING</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight sm:leading-tight">
              Simple, Transparent Pricing
            </h1>

            <p className="text-gray-600 mt-3 text-sm sm:text-base max-w-xl leading-relaxed">
              Choose the pass that best fits your study routine. Instant activation, zero hidden charges, no recurring auto-debits.
            </p>

            {/* Pay Per Chapter Banner Pill */}
            <div className="mt-5 inline-flex items-center gap-2.5 bg-indigo-50 border border-indigo-200/80 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-indigo-900 shadow-2xs">
              <span className="text-lg">⚡</span>
              <span>Pay Per Chapter • Only <strong>₹{perChapterPlan.amount}</strong> / chapter • Valid for 1 Year</span>
            </div>

            {/* Value Pillars List */}
            <div className="mt-6 space-y-3.5 w-full max-w-lg text-left">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-base font-bold">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">Pay Only For What You Study</h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">₹{perChapterPlan.amount} per chapter with 1 full year of unlimited access. No monthly auto-debits.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 text-base font-bold">
                  📝
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">Includes Chapter Exam Mode</h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Full access to unit exams with AI descriptive scoring and instant answer feedback.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-base font-bold">
                  ✨
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">First Level Free in Every Chapter</h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Preview lessons and quizzes completely free before unlocking the full chapter.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Normal Light Themed Plan Card */}
          <div className="lg:col-span-5 flex justify-center w-full">
            {displayedPlans.map((plan) => {
              return (
                <div
                  key={plan.code}
                  className="w-full max-w-md rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative bg-white text-gray-900 shadow-xl shadow-indigo-100/50 border-2 border-indigo-200 hover:border-indigo-300 z-10"
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-6">
                      <span className="text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 border border-amber-300">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col">
                    {/* Plan Name & Desc */}
                    <h3 className="text-xl sm:text-2xl font-black mt-1 text-gray-900">
                      {plan.name}
                    </h3>
                    <p className="text-xs mt-1.5 mb-5 min-h-[32px] text-gray-500 leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Price in plain Rupees */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                        ₹{plan.amount}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        / chapter (1-Year Pass)
                      </span>
                      {plan.discountedFrom > plan.amount && (
                        <span className="text-xs line-through ml-2 text-gray-400">
                          ₹{plan.discountedFrom}
                        </span>
                      )}
                    </div>

                    {/* Sub-price callout */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-900 mb-6">
                      <span>⚡</span>
                      <span>1-Year Access to Lessons + Chapter Exam Mode</span>
                    </div>

                    {/* Feature Checklist */}
                    <div className="space-y-3 mb-8 flex-1">
                      {(plan.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-black bg-emerald-100 text-emerald-700">
                            ✓
                          </div>
                          <span className="text-xs font-semibold text-gray-700 leading-relaxed">
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="mt-auto pt-2 space-y-2.5">
                    <button
                      data-testid="unlock-chapter-btn"
                      disabled={processingPlanCode === plan.code}
                      onClick={() => handleCheckout(plan)}
                      className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 cursor-pointer"
                    >
                      <span>Unlock a Chapter (₹{plan.amount} / 1 Year) ⚡</span>
                    </button>

                    <a
                      href={`https://wa.me/918310532323?text=${encodeURIComponent('Hi! I would like to inquire about unlocking chapters for ₹50 on Hoshiyaar.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>💬 Discuss on WhatsApp (+91 831 053 2323)</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 font-medium text-center mt-3">
            * All subscription and chapter pass prices are subject to change without prior notice.
          </p>
        </div>

        {/* Trust, Security & Payment Assurance Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <span className="text-blue-600 font-extrabold px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-lg">Razorpay</span>
              <span>Supported Payment Methods:</span>
            </div>
            
            {/* Payment Method Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span className="text-emerald-600 font-extrabold">UPI</span>
                <span className="text-[10px] text-gray-500 font-normal">GPay / PhonePe / Paytm</span>
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700">
                RuPay
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700">
                Visa / Master
              </span>
              <span className="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700">
                NetBanking (All Indian Banks)
              </span>
            </div>
          </div>

          {/* 4 Trust Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-lg font-bold">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Instant Unlocking</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Your pass activates right after successful checkout. Start studying immediately.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-lg font-bold">
                🛡️
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">No Lock-in & Zero Risk</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Cancel recurring passes anytime with 1 click. No questions asked.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 text-lg font-bold">
                💬
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Direct WhatsApp Help</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Dedicated parent and student support team on WhatsApp 7 days a week.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 text-lg font-bold">
                🎓
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">100% CBSE & NCERT</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Exact chapter alignment matched with standard school curriculum and exams.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Account Status Card (Positioned below pricing so pricing is immediate) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200 mb-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  Your Account Status
                </span>
                {isSubscribed ? (
                  isCanceled ? (
                    <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      Canceled (Active until {formatDate(userStatus?.currentPeriodEnd)})
                    </span>
                  ) : (
                    <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-green-100 text-green-800">
                      Active Subscriber ⭐
                    </span>
                  )
                ) : isTrialActive ? (
                  <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-orange-100 text-orange-800">
                    Free Trial Active
                  </span>
                ) : (
                  <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                    Free Usage Expired
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isSubscribed
                  ? isCanceled
                    ? 'Subscription Active (Scheduled to End)'
                    : 'Unlimited Learning Pass Active'
                  : isTrialActive
                  ? `${trialDaysRemaining} Day${trialDaysRemaining === 1 ? '' : 's'} Remaining in Free Trial`
                  : userStatus?.purchasedModulesCount > 0
                  ? `Pay As You Go Active (${userStatus.purchasedModulesCount} Unlocked Lesson${userStatus.purchasedModulesCount > 1 ? 's' : ''})`
                  : 'Upgrade to an Unlimited or Single Lesson Pass'}
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-xl">
                {isSubscribed
                  ? isCanceled
                    ? `Your auto-renewal has been canceled. You have full unlimited access until ${formatDate(userStatus?.currentPeriodEnd)}. No further charges will occur.`
                    : `Your pass is active with full access to all chapters and interactive exercises until ${formatDate(userStatus?.currentPeriodEnd)}.`
                  : isTrialActive
                  ? `You have full open access to all lessons during your 30-day free trial period.`
                  : userStatus?.purchasedModulesCount > 0
                  ? `You have unlocked ${userStatus.purchasedModulesCount} lesson${userStatus.purchasedModulesCount > 1 ? 's' : ''} permanently. Continue studying below or upgrade to full access.`
                  : `Your free usage period has concluded. Select a pass above to continue your learning journey.`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
              {userStatus?.purchasedModulesCount > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 text-left md:text-right">
                  <div className="text-lg font-bold text-emerald-800">{userStatus.purchasedModulesCount}</div>
                  <div className="text-[11px] text-emerald-700 font-bold">💎 Unlocked Lessons</div>
                </div>
              )}

              {/* Cancel or Reactivate Action Button */}
              {isSubscribed && (
                <div>
                  {isCanceled ? (
                    <button
                      disabled={reactivating}
                      onClick={handleReactivateSubscription}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      {reactivating ? 'Resuming...' : '🔄 Resume Subscription'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-3.5 py-2 rounded-xl border border-gray-300 hover:border-red-400 text-gray-600 hover:text-red-600 font-bold text-xs bg-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                      title="Cancel your active recurring subscription"
                    >
                      <span>✕</span>
                      <span>Cancel Subscription</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unlocked Chapters List (1-Year Pass) */}
        {userStatus?.purchasedChapters && userStatus.purchasedChapters.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-indigo-200 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl shrink-0">
                  📚
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    My Unlocked Chapters ({userStatus.purchasedChapters.length})
                  </h3>
                  <p className="text-xs text-indigo-700 font-medium">
                    1-Year unlimited access to all lessons &amp; Chapter Exam Mode
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLessonSelector(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all self-start sm:self-center flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span>
                <span>Unlock More Chapters (₹{config?.defaultChapterPrice || 50})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(userStatus?.purchasedChapters || []).map((item, idx) => {
                if (!item) return null;
                const chapterId = item?.chapterId || (typeof item === 'string' ? item : idx);
                const title = item?.title || (typeof item === 'string' ? item : `Chapter ${chapterId}`);
                const isValid = item?.isValid ?? true;
                const amountPaid = item?.amountPaid || perChapterPrice;
                return (
                  <div
                    key={chapterId || idx}
                    className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/20 border border-indigo-200/90 flex items-center justify-between gap-3 hover:shadow-xs transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isValid ? 'bg-indigo-500' : 'bg-gray-400'} shrink-0`}></span>
                        <h4 className="font-bold text-sm text-gray-900 truncate">
                          {title}
                        </h4>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                        {item?.subjectName && <span className="text-gray-600 font-medium">{item.subjectName}</span>}
                        {item?.subjectName && <span>•</span>}
                        <span className="text-indigo-700 font-bold">₹{amountPaid} Paid</span>
                        {item?.expiresAt && (
                          <>
                            <span>•</span>
                            <span className={isValid ? 'text-emerald-700 font-bold' : 'text-rose-600 font-semibold'}>
                              {isValid ? `Valid till ${formatDate(item.expiresAt)}` : 'Expired'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/learn?chapterId=${chapterId}`)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        Learn
                      </button>
                      <button
                        onClick={() => navigate(`/exam?chapterId=${chapterId}`)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        Exam
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unlocked Lessons List (Pay As You Go) */}
        {userStatus?.purchasedModules && userStatus.purchasedModules.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-emerald-200 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                  💎
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    My Unlocked Lessons ({userStatus.purchasedModules.length})
                  </h3>
                  <p className="text-xs text-emerald-700 font-medium">
                    Permanent lifetime access to these lessons on your account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLessonSelector(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all self-start sm:self-center flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span>
                <span>Unlock More Lessons (₹{perLessonPlan?.amount || perChapterPrice})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(userStatus?.purchasedModules || []).map((item, idx) => {
                if (!item) return null;
                const moduleId = item?.moduleId || (typeof item === 'string' ? item : idx);
                const title = item?.title || (typeof item === 'string' ? item : `Lesson ${moduleId}`);
                return (
                  <div
                    key={moduleId || idx}
                    className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/20 border border-emerald-200/90 flex items-center justify-between gap-3 hover:shadow-xs transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <h4 className="font-bold text-sm text-gray-900 truncate">
                          {title}
                        </h4>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                        {item?.chapterTitle && <span className="text-gray-600 font-medium">{item.chapterTitle}</span>}
                        {item?.chapterTitle && <span>•</span>}
                        <span className="text-emerald-700 font-bold">₹{item?.amountPaid || perLessonPrice} Paid</span>
                        {item?.purchasedAt && (
                          <>
                            <span>•</span>
                            <span className="text-gray-400">{formatDate(item.purchasedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/learn/module/${moduleId}`)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open</span>
                      <span className="text-sm">→</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment History & Receipts */}
        {userStatus?.paymentHistory && userStatus.paymentHistory.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200 mb-10">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                🧾
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">
                  Payment History &amp; Receipts
                </h3>
                <p className="text-xs text-gray-500">
                  Verified record of your completed transactions processed via Razorpay
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Item / Description</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Payment ID</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {(userStatus?.paymentHistory || []).map((tx, idx) => {
                    if (!tx) return null;
                    return (
                      <tr key={tx._id || tx.orderId || idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-3 whitespace-nowrap text-gray-500">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-gray-900">
                          {tx.paymentType === 'subscription' 
                            ? (tx.planCode === 'annual_pass' ? 'Annual Unlimited Pass' : 'Monthly Unlimited Pass')
                            : tx.paymentType === 'pay_per_chapter'
                            ? (tx.itemDetails?.chapterTitle ? `Chapter Pass (${tx.itemDetails.chapterTitle})` : 'Pay Per Chapter (1-Year Pass)')
                            : (tx.itemDetails?.count ? `Pay As You Go (${tx.itemDetails.count} Lessons)` : (tx.itemDetails?.moduleTitle || 'Single Lesson Unlock'))}
                        </td>
                        <td className="py-3.5 px-3 font-extrabold text-gray-900">
                          ₹{tx.amount || 50}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-gray-500">
                          {tx.paymentId || tx.orderId || '—'}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            ✓ Successful
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Parent & Student Testimonials (Social Proof) */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Loved by Students & Trusted by Parents
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Real feedback from families learning with Hoshiyaar across India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center text-amber-400 text-sm mb-2.5">
                  ★★★★★
                </div>
                <p className="text-xs text-gray-700 italic leading-relaxed">
                  "My daughter improved her Science and Math scores by 25% within 2 months. The bite-sized lessons and instant practice keep her engaged without feeling overwhelmed."
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                  SS
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Sunita Sharma</div>
                  <div className="text-[10px] text-gray-500">Parent of Class 9 Student, Delhi</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center text-amber-400 text-sm mb-2.5">
                  ★★★★★
                </div>
                <p className="text-xs text-gray-700 italic leading-relaxed">
                  "Revision mode right before unit tests was a lifesaver. Being able to unlock single lessons for quick revision at ₹50 is super affordable and convenient!"
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  AK
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Aryan K.</div>
                  <div className="text-[10px] text-gray-500">Class 10 Student, Bengaluru</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center text-amber-400 text-sm mb-2.5">
                  ★★★★★
                </div>
                <p className="text-xs text-gray-700 italic leading-relaxed">
                  "As a teacher, I recommend Hoshiyaar to all my students. It aligns strictly with NCERT concepts and builds strong exam fundamentals without rote memorization."
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  RV
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">R. Verma</div>
                  <div className="text-[10px] text-gray-500">CBSE Senior Educator, Hyderabad</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 mb-12">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-6">
            Everything Included with Hoshiyaar Learning
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center max-w-2xl mx-auto">
            <div className="p-4 rounded-2xl bg-blue-50/50">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-bold text-gray-800 text-sm sm:text-base">Master Concepts Fast</h4>
              <p className="text-gray-500 text-xs mt-1">Interactive step-by-step flashcards & smart quizzes designed for school syllabus.</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50">
              <div className="text-3xl mb-2">⭐</div>
              <h4 className="font-bold text-gray-800 text-sm sm:text-base">Revision & Exam Mode</h4>
              <p className="text-gray-500 text-xs mt-1">Never forget learned topics with smart spaced revision rounds.</p>
            </div>
          </div>
        </div>

        {/* Parent & Student FAQ (2 Columns on Desktop) */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Heading, Context & WhatsApp Support Card */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold uppercase tracking-wider mb-3 self-center lg:self-start">
                <span>❓ FAQ &amp; HELP</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                Frequently Asked Questions
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mt-2.5 leading-relaxed">
                Everything you need to know about unlocking chapters, exam mode, pricing, and payment security.
              </p>

              {/* Direct Support Contact Card */}
              <div className="mt-6 w-full p-5 sm:p-6 rounded-3xl bg-white border border-indigo-100 shadow-sm text-left">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                    💬
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Still have questions?</h4>
                    <p className="text-xs text-gray-500">We are happy to assist parents &amp; students.</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Connect with our parent support and counseling team directly on WhatsApp for instant guidance on any question.
                </p>
                <a
                  href={`https://wa.me/918310532323?text=${encodeURIComponent('Hi! I have a question about Hoshiyaar subscription and chapter unlocking.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Chat on WhatsApp (+91 831 053 2323)</span>
                  <span>→</span>
                </a>
              </div>
            </div>

            {/* Right Column: FAQ Items */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs hover:border-indigo-200 transition-all">
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-start gap-2.5">
                  <span className="text-indigo-600 font-black">Q.</span>
                  <span>How does Pay Per Chapter (₹50) work?</span>
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm mt-2 pl-6 leading-relaxed">
                  You only pay ₹50 for the specific chapter you need to study (subscription prices are subject to change). Once unlocked, you receive 1 full year of unlimited access to all lessons, interactive quizzes, revision exercises, and Chapter Exam Mode. There are no recurring auto-debits or lock-ins.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs hover:border-indigo-200 transition-all">
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-start gap-2.5">
                  <span className="text-indigo-600 font-black">Q.</span>
                  <span>What is included in Chapter Exam Mode?</span>
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm mt-2 pl-6 leading-relaxed">
                  Chapter Exam Mode allows students to take unit assessments formatted to CBSE &amp; NCERT standards. It features descriptive and subjective questions with instant AI scoring, model answers, and question-by-question review.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs hover:border-indigo-200 transition-all">
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-start gap-2.5">
                  <span className="text-indigo-600 font-black">Q.</span>
                  <span>Can I preview a chapter before unlocking it?</span>
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm mt-2 pl-6 leading-relaxed">
                  Yes, absolutely! The first level of every single chapter in Class 6, 7, and 8 is completely free to preview. You and your child can experience the story and concepts before deciding to unlock the full chapter.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs hover:border-indigo-200 transition-all">
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-start gap-2.5">
                  <span className="text-indigo-600 font-black">Q.</span>
                  <span>What payment methods are supported?</span>
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm mt-2 pl-6 leading-relaxed">
                  We accept all Indian payment methods via Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), all Debit and Credit Cards (Visa, MasterCard, RuPay), and NetBanking across 50+ banks.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs hover:border-indigo-200 transition-all">
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-start gap-2.5">
                  <span className="text-indigo-600 font-black">Q.</span>
                  <span>Will any money be automatically deducted next month?</span>
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm mt-2 pl-6 leading-relaxed">
                  No. Pay Per Chapter is a single one-time payment. We never store payment credentials, and there are zero recurring auto-debit charges. You only pay when you choose to unlock a chapter.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs hover:border-indigo-200 transition-all">
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-start gap-2.5">
                  <span className="text-indigo-600 font-black">Q.</span>
                  <span>Is my payment transaction secure?</span>
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm mt-2 pl-6 leading-relaxed">
                  Yes, 100%. All transactions are processed through Razorpay's 256-bit encrypted, PCI-DSS Level 1 compliant gateway. Your account access is activated immediately upon successful payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Global Footer */}
      <Footer />

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition-colors"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
                🛑
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">
                Cancel Subscription?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                If you cancel, you will still keep <strong>full unlimited access</strong> until{' '}
                <span className="text-gray-900 font-bold">
                  {formatDate(userStatus?.currentPeriodEnd)}
                </span>
                . After that date, your pass will expire and no further payments will be deducted.
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Reason for canceling (Optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select a reason...</option>
                <option value="finished_syllabus">Finished my exam / school syllabus</option>
                <option value="too_expensive">Too expensive / financial reasons</option>
                <option value="taking_break">Taking a temporary break from studies</option>
                <option value="prefer_single_lessons">I prefer paying only per single lesson</option>
                <option value="technical_issue">Technical issues or difficulties</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                Keep My Subscription
              </button>
              <button
                disabled={canceling}
                onClick={handleCancelSubscription}
                className="w-full py-2.5 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors disabled:opacity-50"
              >
                {canceling ? 'Canceling subscription...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Single Lesson Pass: Chapter & Lesson Selector Modal */}
      <LessonUnlockModal
        isOpen={showLessonSelector}
        onClose={() => setShowLessonSelector(false)}
        onSuccess={async (res) => {
          setSuccessMessage(res?.message || 'Lesson unlocked successfully!');
          await loadData();
        }}
        userSubStatus={userStatus}
      />
    </div>
  );
}
