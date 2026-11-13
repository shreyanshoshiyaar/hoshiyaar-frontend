import React, { useState } from 'react';
import authService from '../../services/authService.js';

const ago = (d) => {
  if (!d) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 2) return 'Used just now';
  if (mins < 60) return `Used ${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Used ${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `Used ${days} day${days === 1 ? '' : 's'} ago`;
};

const iconFor = (label = '') => (/computer/i.test(label) ? '💻' : '📱');

/**
 * Shown when a sign-in is blocked by the 3-device limit: lists the devices the account is on and
 * lets the student sign one out, which finishes signing in here. `info` is the DEVICE_LIMIT
 * response ({ devices, ticket, maxDevices }); `onSignedIn` gets the normal login response.
 */
export default function DeviceLimitPicker({ info, guestUserId, onSignedIn, onCancel }) {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [devices, setDevices] = useState(info?.devices || []);
  const [ticket, setTicket] = useState(info?.ticket || '');

  const signOut = async (device) => {
    setBusyId(device.id);
    setError('');
    try {
      const { data } = await authService.signOutOtherDeviceAndLogin({ ticket, deviceSessionId: device.id, guestUserId });
      onSignedIn(data);
    } catch (err) {
      const body = err.response?.data;
      if (body?.code === 'DEVICE_LIMIT') {
        // Another device signed in meanwhile: show the fresh list
        setDevices(body.devices || []);
        setTicket(body.ticket || '');
      }
      setError(body?.message || 'Could not sign that device out. Please try again.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="device-limit-title">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <h2 id="device-limit-title" className="text-lg font-black text-slate-900">Signed in on {info?.maxDevices || 3} devices</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Your account can be used on {info?.maxDevices || 3} devices at a time. Sign one out to continue here.
        </p>

        <ul className="mt-4 space-y-2">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-2xl border-2 border-slate-100 px-3 py-2.5">
              <span className="text-2xl" aria-hidden="true">{iconFor(d.label)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-800 truncate">{d.label}</span>
                <span className="block text-xs font-semibold text-slate-500">{ago(d.lastSeenAt)}</span>
              </span>
              <button
                type="button"
                onClick={() => signOut(d)}
                disabled={Boolean(busyId)}
                className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 border border-rose-200 active:scale-95 disabled:opacity-50"
              >
                {busyId === d.id ? 'Signing out…' : 'Sign out'}
              </button>
            </li>
          ))}
        </ul>

        {error && <p className="mt-3 text-xs font-bold text-rose-600">{error}</p>}
        <p className="mt-3 text-[11px] font-semibold text-slate-400">
          The device you sign out is logged out the next time it opens HoshiYaar.
        </p>
        <button type="button" onClick={onCancel} className="mt-4 w-full rounded-2xl border-2 border-slate-200 py-2.5 text-sm font-black text-slate-600">
          Cancel
        </button>
      </div>
    </div>
  );
}
