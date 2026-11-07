import React, { useEffect, useState } from 'react';
import { openAppSettings, getMicStatus, setMicRemindersOff } from '../../utils/micPermission.js';

export const MIC_SETTINGS_EVENT = 'hy:mic-settings-card';

// Once a day, when Android no longer shows the microphone pop-up: a small card explaining why
// Hoshi needs it and a button to the app's page in phone Settings
export default function MicSettingsPrompt() {
  const [open, setOpen] = useState(false);
  const [canOpenSettings, setCanOpenSettings] = useState(false);

  useEffect(() => {
    const show = () => {
      setCanOpenSettings(Boolean(window.NativeSettings?.openAppSettings));
      setOpen(true);
    };
    window.addEventListener(MIC_SETTINGS_EVENT, show);
    return () => window.removeEventListener(MIC_SETTINGS_EVENT, show);
  }, []);

  // Close by itself once the learner comes back from Settings with the microphone allowed
  useEffect(() => {
    if (!open) return undefined;
    const onVisible = async () => {
      if (document.visibilityState === 'visible' && (await getMicStatus()) === 'granted') setOpen(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center bg-slate-900/50 p-3" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl" aria-hidden="true">🎙️</div>
        <h2 className="mt-3 text-center text-lg font-black text-slate-900">Let Hoshi hear you</h2>
        <p className="mt-1 text-center text-sm font-semibold text-slate-600 leading-snug">
          Some questions ask you to say a word out loud. Turn on the microphone so Hoshi can hear your answer.
        </p>
        {canOpenSettings ? (
          <p className="mt-2 text-center text-xs font-semibold text-slate-500">Open Settings → Permissions → Microphone → Allow</p>
        ) : (
          <p className="mt-2 text-center text-xs font-semibold text-slate-500">Phone Settings → Apps → HoshiYaar → Permissions → Microphone → Allow</p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          {canOpenSettings && (
            <button
              onClick={() => { openAppSettings(); }}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm"
            >
              Open Settings
            </button>
          )}
          <button onClick={() => setOpen(false)} className="w-full py-2.5 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-50">
            Not now
          </button>
          <button
            onClick={() => { setMicRemindersOff(true); setOpen(false); }}
            className="w-full py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
          >
            Don't remind me (you can turn it on later in More)
          </button>
        </div>
      </div>
    </div>
  );
}
