import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccess } from '../../../context/AccessContext.jsx';
import { vibrateSuccess, vibrateError } from '../../../utils/vibrationService.js';

// Back from Razorpay's redirect checkout (phone browsers): the address carries ?payment=success,
// failed or check. Refresh access (asking the server to check Razorpay too), say how it went,
// and clean the address.
export default function PaymentReturnNotice() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refresh } = useAccess();
  const [notice, setNotice] = useState(null); // { tone, text }
  // Cleaning the address re-runs the effect; only unmounting should stop the check
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const result = params.get('payment');
    if (!result) return;
    params.delete('payment');
    const rest = params.toString();
    navigate(`${location.pathname}${rest ? `?${rest}` : ''}`, { replace: true });

    (async () => {
      setNotice({ tone: 'wait', text: 'Confirming your payment…' });
      // A few tries: the webhook may land a moment after the redirect
      let active = false;
      for (let i = 0; i < 3 && !active && mounted.current; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 3000));
        const next = await refresh({ reconcile: true });
        active = next?.state === 'pass';
      }
      if (!mounted.current) return;
      if (active) {
        vibrateSuccess();
        setNotice({ tone: 'ok', text: '👑 Your Pro pass is active. Enjoy every lesson!' });
      } else if (result === 'failed') {
        vibrateError();
        setNotice({ tone: 'bad', text: "Payment didn't go through. If money was deducted, your bank returns it automatically. You can try again." });
      } else {
        setNotice({ tone: 'wait', text: 'If you paid, your pass will unlock within a few minutes. Reopen the Pro page to check.' });
      }
      setTimeout(() => { if (mounted.current) setNotice(null); }, 7000);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  if (!notice) return null;
  const tone = notice.tone === 'ok'
    ? 'bg-emerald-600'
    : notice.tone === 'bad' ? 'bg-rose-600' : 'bg-slate-800';
  return (
    <div className="fixed left-3 right-3 top-3 z-[10060] flex justify-center pointer-events-none" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
      <div role="status" className={`pointer-events-auto max-w-md w-full ${tone} text-white rounded-2xl shadow-2xl px-4 py-3 text-sm font-bold flex items-center gap-3`}>
        {notice.tone === 'wait' && <span className="w-4 h-4 shrink-0 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />}
        <span className="flex-1">{notice.text}</span>
        <button onClick={() => setNotice(null)} className="text-white/80 font-black" aria-label="Dismiss">✕</button>
      </div>
    </div>
  );
}
