import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import paymentService from '../../../services/paymentService.js';

export default function PaywallModal({
  isOpen,
  onClose,
  onSuccess,
  chapterId,
  chapterTitle = '',
  moduleId,
  moduleTitle = 'Lesson',
  price = null,
  plans = [],
  mockMode = false,
  razorpayKeyId = ''
}) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fetchedPlans, setFetchedPlans] = useState(plans);
  const [defaultPrice, setDefaultPrice] = useState(50);

  useEffect(() => {
    paymentService.getPublicConfig().then(cfg => {
      if (cfg?.plans?.length) setFetchedPlans(cfg.plans);
      if (cfg?.defaultChapterPrice) setDefaultPrice(cfg.defaultChapterPrice);
      else if (cfg?.defaultLessonPrice) setDefaultPrice(cfg.defaultLessonPrice);
    }).catch(() => {});
  }, []);

  if (!isOpen) return null;

  const activePlans = fetchedPlans && fetchedPlans.length > 0 ? fetchedPlans : plans;
  const chapterPlan = activePlans.find((p) => p.type === 'pay_per_chapter' || p.code === 'pay_per_chapter') || {
    code: 'pay_per_chapter',
    name: 'Pay Per Chapter (1 Year Pass)',
    amount: defaultPrice,
    discountedFrom: 99,
    type: 'pay_per_chapter'
  };

  const finalAmount = price != null && Number(price) > 0 ? Number(price) : (chapterPlan.amount || defaultPrice || 50);
  const originalAmount = chapterPlan.discountedFrom || (finalAmount * 2);

  const displayTitle = chapterTitle || moduleTitle || 'Chapter';

  const handlePay = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Create order for chapter
      const orderData = await paymentService.createOrder({
        planCode: chapterPlan.code,
        chapterId: chapterId,
        moduleId: moduleId
      });

      // 2. Mock mode instant checkout
      if (orderData.mockMode) {
        const mockRes = await paymentService.mockSuccessPayment({
          planCode: chapterPlan.code,
          chapterId: chapterId,
          moduleId: moduleId
        });

        if (mockRes.success) {
          onSuccess?.();
          onClose?.();
        } else {
          setErrorMsg(mockRes.message || 'Mock payment simulation failed.');
        }
        setLoading(false);
        return;
      }

      // 3. Real Razorpay modal
      const isLoaded = await paymentService.loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load payment gateway. Please check your connection.');
      }

      const razorpayKey = orderData.keyId || razorpayKeyId;


      const options = {
        key: razorpayKey,
        amount: orderData.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'Hoshiyaar Learning',
        description: `Unlock ${displayTitle} (1-Year Pass)`,
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
              planCode: chapterPlan.code,
              chapterId: chapterId,
              moduleId: moduleId
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
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('[Razorpay] Payment failed:', response?.error);
        setErrorMsg(response?.error?.description || response?.error?.reason || 'Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Payment failed to initiate.');
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi! I would like to discuss unlocking Chapter "${displayTitle}" on Hoshiyaar.`
  );
  const whatsappUrl = `https://wa.me/918310532323?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative border border-gray-100 overflow-hidden transform transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm transition-colors z-10 active:scale-95 cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header Icon & Tag */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200/80 flex items-center justify-center mx-auto mb-2.5 text-2xl shadow-inner">
            🔒
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100/70 text-amber-800 border border-amber-200 inline-block mb-1.5">
            Chapter Locked • 1-Year Pass
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug px-2">
            Unlock {displayTitle}
          </h2>
          <p className="text-xs font-semibold text-blue-600 mt-1">
            Includes Chapter Exam Mode & all interactive lessons for 1 Year
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Valid for 365 days from purchase • No automatic renewals
          </p>
        </div>

        {/* Mock Sandbox Notice */}
        {mockMode && (
          <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl px-3 py-2 flex items-center justify-between">
            <span>🧪 <strong>Sandbox Active</strong>: 1-click test checkout</span>
            <span className="bg-amber-200 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded">TEST</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-purple-50/50 rounded-2xl p-4 border-2 border-indigo-100 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
              1-Year Chapter Pass
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-xs">
              365 Days Access
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-black text-gray-900">₹{finalAmount}</span>
            <span className="text-xs font-bold text-gray-500">/ 1 year</span>
            {originalAmount > finalAmount && (
              <span className="text-xs text-gray-400 line-through font-semibold">₹{originalAmount}</span>
            )}
          </div>

          {/* Benefit Bullets */}
          <ul className="space-y-1.5 text-xs text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>1 Full Year access to all lessons in this chapter</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Unlocks Chapter Exam Mode with instant AI evaluation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Interactive quizzes, challenges & revision cards</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Continuous score tracking & detailed review analyses</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Primary: Pay Now */}
          <button
            disabled={loading}
            onClick={handlePay}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Opening Checkout...</span>
              </div>
            ) : (
              <>
                <span>Pay ₹{finalAmount} to Unlock Chapter (1 Year)</span>
                <span>⚡</span>
              </>
            )}
          </button>

          {/* Secondary: Discuss on WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-center cursor-pointer"
          >
            {/* WhatsApp SVG Icon */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Discuss on WhatsApp (+91 831 053 2323)</span>
          </a>
        </div>

        {/* Footer info */}
        <div className="text-center pt-3 mt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            100% safe & encrypted payments via Razorpay • UPI, Cards & NetBanking
          </p>
        </div>
      </div>
    </div>
  );
}
