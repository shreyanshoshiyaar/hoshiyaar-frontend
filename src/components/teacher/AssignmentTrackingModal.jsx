import React, { useState, useEffect } from 'react';
import teacherService from '../../services/teacherService.js';

export default function AssignmentTrackingModal({ assignmentId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'completed'
  const [copied, setCopied] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');

  const handleNudgePending = async () => {
    if (!assignmentId || nudging) return;
    try {
      setNudging(true);
      setNudgeMessage('');
      const res = await teacherService.nudgePendingStudents(assignmentId);
      setNudgeMessage(res.data?.message || 'Push reminder sent to pending students!');
      setTimeout(() => setNudgeMessage(''), 6000);
    } catch (err) {
      console.error('Failed to send nudge:', err);
      alert(err.response?.data?.message || 'Failed to send push reminder');
    } finally {
      setNudging(false);
    }
  };

  useEffect(() => {
    if (isOpen && assignmentId) {
      loadTracking();
    }
  }, [isOpen, assignmentId]);

  const loadTracking = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await teacherService.getAssignmentTracking(assignmentId);
      setData(res.data);
      // If majority completed, default to completed tab
      if (res.data?.completedStudents?.length > res.data?.pendingStudents?.length) {
        setActiveTab('completed');
      }
    } catch (err) {
      console.error('Failed to load tracking data', err);
      setError('Unable to load tracking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!data?.whatsappReportText) return;
    navigator.clipboard.writeText(data.whatsappReportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Copy failed', err);
    });
  };

  const handleShareWhatsApp = () => {
    if (!data?.whatsappReportText) return;
    const encoded = encodeURIComponent(data.whatsappReportText);
    const url = `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  const {
    assignment,
    classroom,
    summary,
    completedStudents = [],
    pendingStudents = [],
    whatsappReportText,
  } = data || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-6">

        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-br from-slate-950 via-[#0F172A] to-[#1E293B] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-amber-300 border border-slate-800 flex items-center justify-center text-xl shrink-0 shadow-md">
              📊
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Homework Tracking & Report</h3>
              <p className="text-xs text-slate-300 font-medium">
                {classroom?.name} • {assignment?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-amber-400 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-500">Checking student lesson completions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-red-600 mb-3">{error}</p>
            <button
              onClick={loadTracking}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Completion Rate</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {summary?.completionRate}%
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-500"
                    style={{ width: `${summary?.completionRate || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Enrolled</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {summary?.totalStudents}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">in this classroom</span>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Completed</span>
                <div className="text-2xl font-black text-emerald-700 mt-0.5">
                  {summary?.completedCount}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">100% finished</span>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Pending</span>
                <div className="text-2xl font-black text-amber-700 mt-0.5">
                  {summary?.pendingCount}
                </div>
                <span className="text-[10px] text-amber-600 font-semibold">needs completion</span>
              </div>
            </div>

            {/* Quick Action Banners */}
            <div className="space-y-3">
              {/* Push Notification Nudge Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-sm shrink-0">
                    🔔
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                      Send Firebase Push Reminder
                    </h4>
                    <p className="text-xs text-blue-800 font-medium">
                      Notify {pendingStudents.length} pending student{pendingStudents.length === 1 ? '' : 's'} on their phone screens right now.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <button
                    onClick={handleNudgePending}
                    disabled={nudging || pendingStudents.length === 0}
                    className={`w-full sm:w-auto px-4 py-2.5 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                      pendingStudents.length === 0
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {nudging ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Push...</span>
                      </>
                    ) : (
                      <>
                        <span>🔔 Remind Pending ({pendingStudents.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Nudge Feedback Toast */}
              {nudgeMessage && (
                <div className="p-3 bg-blue-600 text-white text-xs font-bold rounded-xl text-center shadow-md animate-fade-in flex items-center justify-center gap-2">
                  <span>🚀</span>
                  <span>{nudgeMessage}</span>
                </div>
              )}

              {/* WhatsApp 1-Click Action Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center text-xl shadow-sm shrink-0">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      Instant WhatsApp Report
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      Send or copy a pre-formatted summary of who finished and who hasn't.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyReport}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-xs"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy Text'}
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>Share on WhatsApp</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs: Completed vs Pending */}
            <div>
              <div className="flex border-b border-slate-200 mb-4">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === 'pending'
                      ? 'border-amber-500 text-amber-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>⏳ Pending ({pendingStudents.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === 'completed'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span>✅ Completed ({completedStudents.length})</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'pending' ? (
                pendingStudents.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-3xl">🎉</span>
                    <h5 className="text-sm font-black text-slate-800 mt-2">All students have completed this homework!</h5>
                    <p className="text-xs text-slate-400 font-medium">100% participation achieved.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingStudents.map((s, idx) => (
                      <div
                        key={s._id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-white transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                            {(s.name || s.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-800">{s.name}</div>
                            <div className="text-[11px] text-slate-400">
                              @{s.username} {s.phone ? `• ${s.phone}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-black text-amber-700">
                              {s.completedCount} of {s.totalTargets} lessons
                            </span>
                            <div className="w-20 bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{ width: `${s.progressPercent}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-lg uppercase">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                completedStudents.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="text-3xl">⏳</span>
                    <h5 className="text-sm font-black text-slate-800 mt-2">No students have completed this yet</h5>
                    <p className="text-xs text-slate-400 font-medium">Progress will automatically update as students solve lessons.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {completedStudents.map((s, idx) => (
                      <div
                        key={s._id}
                        className="flex items-center justify-between p-3.5 bg-emerald-50/50 border border-emerald-150 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                            {(s.name || s.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-800">{s.name}</div>
                            <div className="text-[11px] text-slate-400">
                              @{s.username} {s.phone ? `• ${s.phone}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 mr-2">
                            ⭐ {s.totalPoints} pts
                          </span>
                          <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <span>✔</span>
                            <span>Finished</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={loadTracking}
            disabled={loading}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
          >
            <span>🔄</span>
            <span>Refresh Live Data</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
