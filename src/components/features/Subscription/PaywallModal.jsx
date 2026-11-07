import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useAccess } from '../../../context/AccessContext.jsx';
import paymentService from '../../../services/paymentService.js';
import { usesPlayBilling, playBillingAvailable, getPassOffers, pickPassOffer, buyPassWithPlay, PLAY_STORE_URL } from '../../../services/billingService.js';
import { isUserAdmin } from '../../../utils/adminCheck.js';
import GuestVerifyModal from '../../forms/GuestVerifyModal.jsx';
import { vibrateSuccess } from '../../../utils/vibrationService.js';
import { getApiBase } from '../../../utils/apiBase.js';

// Phone browsers: Razorpay's popup can get stuck on "Processing your payment" (bank pages and UPI
// apps can't return to a popup), so there Razorpay redirects to our server and back instead
const useRedirectCheckout = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') ||
  (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent || ''));

const PASS_PLAN_CODE = 'pass_6m';
const FALLBACK_PLAN = { code: PASS_PLAN_CODE, amount: 99, discountedFrom: 599 };

// One paywall for the whole app: the 6-month pass, ₹99 against ₹599.
// Android pays through Google Play Billing, the website through Razorpay.
export default function PaywallModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const { access, refresh, testView, setTestView } = useAccess();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [plan, setPlan] = useState(FALLBACK_PLAN);
  const [mockMode, setMockMode] = useState(false);
  // Every price option Google Play returns for the pass, and the one being sold
  const [playOffers, setPlayOffers] = useState([]);
  // '' | 'opening' (Play sheet open) | 'processing' (paid, server confirming with Google)
  const [stage, setStage] = useState('');
  const playBilling = usesPlayBilling();

  useEffect(() => {
    if (!isOpen) return;
    if (access?.plan?.amount) {
      setPlan(prev => ({
        ...prev,
        amount: access.plan.amount,
        discountedFrom: access.plan.discountedFrom || prev.discountedFrom
      }));
    }
    paymentService.getPublicConfig().then(cfg => {
      const pass = cfg?.plans?.find(p => p.code === PASS_PLAN_CODE);
      if (pass) setPlan(pass);
      setMockMode(Boolean(cfg?.mockMode));
    }).catch(() => {});
    if (playBilling) getPassOffers().then(setPlayOffers);
  }, [isOpen, playBilling, access?.plan?.amount, access?.plan?.discountedFrom]);

  if (!isOpen) return null;

  // Passes belong to a real account, so guests sign up first (their trial carries over)
  if (user?.isGuest) return <GuestVerifyModal onClose={onClose} />;

  const price = `₹${plan.amount}`;
  const playOffer = playBilling ? pickPassOffer(playOffers, plan.amount) : null;
  // In the app Google Play charges, so its price is the one shown; ours is the website price
  const priceLabel = playOffer?.label || price;
  const chargedAmount = playOffer && Number.isFinite(playOffer.price) ? playOffer.price : plan.amount;
  const playPriceDiffers = Boolean(playOffer && Number.isFinite(playOffer.price) && playOffer.price !== Number(plan.amount));
  const original = plan.discountedFrom > chargedAmount ? `₹${plan.discountedFrom}` : null;
  const showPriceCheck = playBilling && isUserAdmin(user);

  // Callers close the pop-up in onSuccess; calling onClose too would send a learner back to
  // the map instead of into the lesson they just unlocked
  const finishSuccess = async () => {
    vibrateSuccess();
    if (testView) setTestView('');
    await refresh();
    onSuccess?.();
  };

  // Asks the server whether Razorpay has the payment (the server checks Razorpay directly),
  // for when the checkout closed or our confirmation call failed after the learner paid
  const confirmWithServer = async ({ attempts = 1, quiet = false } = {}) => {
    if (!quiet) setInfoMsg('Checking your payment…');
    for (let i = 0; i < attempts; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 4000));
      const next = await refresh({ reconcile: true });
      if (next?.state === 'pass') {
        setInfoMsg('');
        await finishSuccess();
        return true;
      }
    }
    if (!quiet) setInfoMsg('If you completed the payment, your pass will unlock within a few minutes. You can close this window.');
    setLoading(false);
    return false;
  };

  const payWithPlay = async () => {
    setStage('opening');
    const result = await buyPassWithPlay(user._id, {
      offerToken: playOffer?.offerToken,
      onProcessing: () => setStage('processing')
    });
    setStage('');
    if (result.status === 'success') return finishSuccess();
    if (result.status === 'pending') {
      setInfoMsg(result.message);
      refresh();
    } else if (result.status === 'error') {
      setErrorMsg(result.message);
    }
    setLoading(false);
  };

  const payWithRazorpay = async () => {
    const orderData = await paymentService.createOrder({ planCode: PASS_PLAN_CODE });

    if (orderData.mockMode) {
      const mockRes = await paymentService.mockSuccessPayment({ planCode: PASS_PLAN_CODE });
      if (mockRes.success) return finishSuccess();
      setErrorMsg(mockRes.message || 'Mock payment simulation failed.');
      setLoading(false);
      return;
    }

    const isLoaded = await paymentService.loadRazorpayScript();
    if (!isLoaded) throw new Error('Could not load payment gateway. Please check your connection.');

    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amountInPaise,
      currency: orderData.currency || 'INR',
      name: 'HoshiYaar',
      description: '6-Month Pass: all lessons',
      order_id: orderData.order_id || orderData.orderId,
      prefill: { name: user?.name || '', contact: user?.phone || '', email: user?.email || '' },
      theme: { color: '#2563EB' },
      ...(useRedirectCheckout() ? {
        redirect: true,
        callback_url: `${getApiBase()}/api/payments/razorpay/callback?site=${encodeURIComponent(window.location.origin)}&return=${encodeURIComponent(window.location.pathname + window.location.search)}`
      } : {}),
      handler: async (response) => {
        try {
          const verifyRes = await paymentService.verifyPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            planCode: PASS_PLAN_CODE
          });
          if (verifyRes.success) return finishSuccess();
          setErrorMsg(verifyRes.message || 'Payment verification failed.');
          setLoading(false);
        } catch (err) {
          // Paid, but the confirmation did not reach us: let the server check with Razorpay
          if (!err.response || err.response.status >= 500) return confirmWithServer({ attempts: 3 });
          setErrorMsg(err.response?.data?.message || 'Payment verification error.');
          setLoading(false);
        }
      },
      // Closed the checkout: usually a cancel, but a UPI payment may have gone through
      modal: { ondismiss: () => { confirmWithServer({ quiet: true }); } }
    });
    rzp.on('payment.failed', (response) => {
      setErrorMsg(response?.error?.description || response?.error?.reason || 'Payment failed. Please try again.');
      setLoading(false);
    });
    rzp.open();
  };

  const handlePay = async () => {
    setErrorMsg('');
    setInfoMsg('');
    // One pass at a time (the server refuses a second Razorpay order too)
    if (access?.hasPass && !testView) {
      setInfoMsg('Your Pro pass is already active. You can buy a new one after it ends.');
      return;
    }
    if (playBilling && !playBillingAvailable()) {
      window.open(PLAY_STORE_URL, '_system');
      return;
    }
    setLoading(true);
    try {
      if (playBilling) await payWithPlay();
      else await payWithRazorpay();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Payment failed to start.');
      setLoading(false);
    }
  };

  const headline = access?.trialEndReason === 'time'
    ? 'Your 48-hour free trial has ended'
    : access?.trialEndReason === 'lessons'
      ? `You've played all ${access?.trialLessonLimit || 7} free lessons`
      : 'Unlock every lesson';
  const savePct = original ? Math.round((1 - chargedAmount / plan.discountedFrom) * 100) : 0;
  const perMonth = (chargedAmount / 6).toFixed(chargedAmount % 6 === 0 ? 0 : 1);
  const needsUpdate = playBilling && !playBillingAvailable();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0B0820]/70 backdrop-blur-sm animate-fade-in font-sans">
      {/* gold frame */}
      <div className="relative w-full max-w-md rounded-[28px] p-[2px] bg-gradient-to-br from-[#FDE68A] via-[#D97706] to-[#FDE68A] shadow-[0_24px_60px_rgba(30,27,75,0.55)]">
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1E1B4B] via-[#3B0764] to-[#4C1D95] px-5 pt-6 pb-5">
          <span className="pointer-events-none absolute -top-16 -right-12 w-52 h-52 rounded-full bg-[#F59E0B]/25 blur-3xl" aria-hidden="true" />
          <span className="pointer-events-none absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-[#A855F7]/30 blur-3xl" aria-hidden="true" />

          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/10 border border-white/15 text-white/80 hover:text-white flex items-center justify-center active:scale-95 cursor-pointer"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>

          {/* header */}
          <div className="relative text-center">
            <span className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FDE68A]/25 to-[#F59E0B]/10 border border-[#FCD34D]/40 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.35)]">
              <svg viewBox="0 0 24 24" className="w-9 h-9" aria-hidden="true">
                <defs>
                  <linearGradient id="pwCrown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FEF3C7" />
                    <stop offset="60%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
                <path d="M4 17L2.5 7l5.5 4.5L12 4l4 7.5L21.5 7 20 17z" fill="url(#pwCrown)" />
                <rect x="4" y="18" width="16" height="2.5" rx="1.2" fill="url(#pwCrown)" />
              </svg>
            </span>
            <p className="mt-3 text-[13px] font-black uppercase tracking-[0.18em] text-[#FCD34D]">HoshiYaar Pro</p>
            <h2 className="mt-1 text-[22px] font-black text-white leading-snug px-3">{headline}</h2>
            <p className="mt-1.5 text-[15px] font-semibold text-indigo-200">Ask a parent to unlock every lesson for 6 months.</p>
            {access?.locked && (
              <p className="mt-1 text-[13px] font-semibold text-indigo-200/70">Lessons you've already played stay open.</p>
            )}
          </div>

          {mockMode && !playBilling && (
            <div className="relative mt-4 rounded-xl bg-[#FCD34D]/15 border border-[#FCD34D]/40 px-3 py-2 text-[13px] font-bold text-[#FDE68A] flex items-center justify-between">
              <span>Sandbox: 1-click test checkout</span>
              <span className="rounded bg-[#FCD34D] px-1.5 py-px text-[10px] font-black text-[#3B0764]">TEST</span>
            </div>
          )}
          {errorMsg && (
            <div className="relative mt-4 rounded-xl bg-rose-500/15 border border-rose-300/40 px-3 py-2 text-[13px] font-bold text-rose-100 flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="font-black text-rose-100/80" aria-label="Dismiss">✕</button>
            </div>
          )}
          {stage === 'processing' && (
            <div className="relative mt-4 rounded-xl bg-[#22C55E]/15 border border-[#86EFAC]/40 px-3 py-2.5 flex items-center gap-2.5">
              <span className="w-4 h-4 shrink-0 border-[2.5px] border-[#86EFAC] border-t-transparent rounded-full animate-spin" />
              <span className="text-[13px] font-bold text-[#DCFCE7]">Payment received. Confirming it with Google Play, please keep the app open…</span>
            </div>
          )}
          {infoMsg && (
            <div className="relative mt-4 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-[13px] font-bold text-indigo-100">
              {infoMsg}
            </div>
          )}

          {/* price */}
          <div className="relative mt-5 rounded-[20px] bg-white/[0.07] border border-white/15 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-black uppercase tracking-[0.16em] text-[#FCD34D]">6-Month Pass</span>
              {savePct > 0 && (
                <span className="rounded-full bg-[#22C55E]/20 px-2 py-0.5 text-[12px] font-black text-[#86EFAC]">Save {savePct}%</span>
              )}
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[40px] font-black text-white leading-none">{priceLabel}</span>
              {original && <span className="mb-1 text-lg font-bold text-white/45 line-through decoration-[#FB7185] decoration-2">{original}</span>}
            </div>
            <p className="mt-1 text-[14px] font-semibold text-indigo-200">One-time payment · just ₹{perMonth} a month</p>
            {playPriceDiffers && (
              <p className="mt-1 text-[12px] font-semibold text-indigo-200/75">Price set by Google Play, including all taxes. Nothing else is added.</p>
            )}
            <ul className="mt-3 space-y-2">
              {['Every lesson in every chapter', 'Stories, boards, quizzes and revision', 'No auto-renewal, ever'].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[14px] font-semibold text-white/90">
                  <span className="w-5 h-5 rounded-full bg-[#FCD34D]/20 text-[#FCD34D] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* action */}
          <button
            disabled={loading}
            onClick={handlePay}
            className="relative mt-5 w-full py-3.5 rounded-full bg-gradient-to-b from-[#FEF3C7] via-[#FCD34D] to-[#F59E0B] text-[#3B0764] font-black text-[16px] shadow-[0_4px_0_0_#B45309,0_0_22px_rgba(252,211,77,0.45)] active:translate-y-0.5 active:shadow-none disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-[2.5px] border-[#3B0764] border-t-transparent rounded-full animate-spin" />
                <span>{stage === 'processing' ? 'Payment processing…' : playBilling ? 'Opening Google Play…' : 'Opening checkout…'}</span>
              </>
            ) : needsUpdate ? (
              <span>Update the app to unlock</span>
            ) : (
              <span>Unlock Pro for {priceLabel}</span>
            )}
          </button>

          <p className="relative mt-3 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-indigo-200/80">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            {needsUpdate
              ? 'Get the latest HoshiYaar from Google Play'
              : playBilling ? 'Secure payment through Google Play' : 'Secure payment via Razorpay · UPI & cards'}
          </p>

          {/* Admins only: exactly what Google Play returns, to match it against Play Console */}
          {showPriceCheck && (
            <div className="relative mt-3 rounded-xl border border-dashed border-[#FCD34D]/50 bg-black/20 px-3 py-2 text-[11px] font-semibold text-indigo-100 leading-relaxed">
              <p className="font-black uppercase tracking-wider text-[#FCD34D]">Admin · Play price check</p>
              <p>Our price (website & server): ₹{plan.amount}</p>
              {playOffers.length === 0 ? (
                <p>Google Play returned no price for hoshiyaar_pass_6m</p>
              ) : playOffers.map((o, i) => (
                <p key={o.offerToken || i}>
                  {o === playOffer ? '▶ ' : '• '}Play option {o.purchaseOptionId || '(legacy)'}{o.offerId ? ` / offer ${o.offerId}` : ''}: {o.label} ({o.price} {o.currency})
                </p>
              ))}
              <p className="text-indigo-200/70">▶ = the option the Buy button uses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
