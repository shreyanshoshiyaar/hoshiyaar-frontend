import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import curriculumService from '../../../services/curriculumService.js';
import paymentService from '../../../services/paymentService.js';

export default function LessonUnlockModal({ isOpen, onClose, onSuccess, userSubStatus }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-fetch student class level directly from user context
  const studentClass = useMemo(() => {
    return String(user?.classLevel || user?.class || localStorage.getItem('classLevel') || '6');
  }, [user]);

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);

  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [unlockedSuccess, setUnlockedSuccess] = useState(null);

  // Set of already purchased module IDs
  const purchasedModuleSet = useMemo(() => {
    const set = new Set();
    if (userSubStatus?.purchasedModules?.length) {
      userSubStatus.purchasedModules.forEach(m => {
        if (m.moduleId) set.add(String(m.moduleId));
        else if (typeof m === 'string') set.add(String(m));
      });
    }
    return set;
  }, [userSubStatus]);

  // Set of already purchased chapter IDs (including active homework free chapters)
  const purchasedChapterSet = useMemo(() => {
    const set = new Set();
    if (userSubStatus?.purchasedChapters?.length) {
      userSubStatus.purchasedChapters.forEach(c => {
        if (c.chapterId) {
          const isExpired = c.expiresAt && new Date(c.expiresAt) <= new Date();
          if (!isExpired) set.add(String(c.chapterId));
        } else if (typeof c === 'string') {
          set.add(String(c));
        }
      });
    }
    if (userSubStatus?.homeworkFreeChapters?.length) {
      userSubStatus.homeworkFreeChapters.forEach(ch => {
        const id = ch?.chapterId || (typeof ch === 'string' ? ch : null);
        if (id) set.add(String(id));
      });
    }
    return set;
  }, [userSubStatus]);

  const isChapterPurchased = Boolean(selectedChapter?.id && purchasedChapterSet.has(String(selectedChapter.id)));

  // Dynamic free levels per chapter
  const freeLessonsCount = selectedChapter?.freeLessonsCount != null
    ? Number(selectedChapter.freeLessonsCount)
    : (userSubStatus?.defaultFreeLessonsCount ?? 1);

  // Derived list of locked lessons
  const lockedLessons = useMemo(() => {
    if (isChapterPurchased) return [];
    return lessons.filter((lesson, idx) => idx >= freeLessonsCount && !purchasedModuleSet.has(String(lesson._id)));
  }, [lessons, purchasedModuleSet, freeLessonsCount, isChapterPurchased]);

  // Check if all locked lessons are selected
  const allLockedSelected = useMemo(() => {
    return lockedLessons.length > 0 && lockedLessons.every(l => selectedLessons.some(s => s._id === l._id));
  }, [lockedLessons, selectedLessons]);

  // Toggle selection for an individual lesson
  const toggleLessonSelection = (lesson) => {
    setSelectedLessons(prev => {
      const exists = prev.some(l => l._id === lesson._id);
      if (exists) {
        return prev.filter(l => l._id !== lesson._id);
      } else {
        return [...prev, lesson];
      }
    });
  };

  // Toggle select all locked lessons
  const toggleSelectAllLocked = () => {
    if (allLockedSelected) {
      setSelectedLessons([]);
    } else {
      setSelectedLessons([...lockedLessons]);
    }
  };

  const unitPrice = selectedChapter?.lessonPrice != null
    ? Number(selectedChapter.lessonPrice)
    : (userSubStatus?.defaultLessonPrice ?? 50);
  const chapterPrice = selectedChapter?.chapterPrice != null
    ? Number(selectedChapter.chapterPrice)
    : (userSubStatus?.defaultChapterPrice ?? 50);
  const totalPrice = selectedLessons.length * unitPrice;

  // 1. Fetch Chapters for student's account class
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchChapters = async () => {
      try {
        setLoadingChapters(true);
        setErrorMessage('');
        setLessons([]);
        setSelectedLessons([]);

        const board = user?.board || 'CBSE';
        const subject = user?.subject || 'Science';
        const extraParams = {
          classTitle: studentClass
        };

        const res = await curriculumService.listChapters(board, subject, extraParams);
        if (!isMounted) return;

        const rawList = res?.data || res || [];
        const validChapters = rawList.map((c, idx) => ({
          id: c._id,
          title: c.title,
          order: c.order ?? idx + 1,
          chapterPrice: c.chapterPrice != null ? Number(c.chapterPrice) : (c.lessonPrice != null ? Number(c.lessonPrice) : 50),
          freeLessonsCount: c.freeLessonsCount != null ? Number(c.freeLessonsCount) : 1,
          isComingSoon: c.title?.includes('(Coming Soon)')
        }));

        setChapters(validChapters);

        // Pre-select first chapter that is not "Coming Soon"
        const firstAvailable = validChapters.find(c => !c.isComingSoon) || validChapters[0] || null;
        setSelectedChapter(firstAvailable);
      } catch (err) {
        if (isMounted) {
          console.error('[LessonUnlockModal] Error fetching chapters:', err);
          setErrorMessage('Could not load chapters for your class.');
        }
      } finally {
        if (isMounted) setLoadingChapters(false);
      }
    };

    fetchChapters();
    return () => { isMounted = false; };
  }, [isOpen, studentClass, user]);

  // 2. Fetch Lessons when Chapter changes
  useEffect(() => {
    if (!isOpen || !selectedChapter?.id) {
      setLessons([]);
      setSelectedLessons([]);
      return;
    }

    let isMounted = true;
    const fetchLessons = async () => {
      try {
        setLoadingLessons(true);
        setSelectedLessons([]);
        setErrorMessage('');

        const res = await curriculumService.listModules(selectedChapter.id);
        if (!isMounted) return;

        const rawModules = res?.data || res || [];
        const sorted = [...rawModules].sort((a, b) => (a.order || 0) - (b.order || 0));
        setLessons(sorted);
      } catch (err) {
        if (isMounted) {
          console.error('[LessonUnlockModal] Error fetching lessons:', err);
          setErrorMessage('Could not load lessons for this chapter.');
        }
      } finally {
        if (isMounted) setLoadingLessons(false);
      }
    };

    fetchLessons();
    return () => { isMounted = false; };
  }, [isOpen, selectedChapter]);

  if (!isOpen) return null;

  // 3. Initiate Payment for Selected Lessons
  const handleProceedToPayment = async () => {
    if (selectedLessons.length === 0) return;
    setProcessingPayment(true);
    setErrorMessage('');

    const targetModuleIds = selectedLessons.map(l => l._id);

    try {
      // 1. Create order for pay_per_lesson
      const orderData = await paymentService.createOrder({
        planCode: 'pay_per_lesson',
        moduleId: targetModuleIds[0],
        moduleIds: targetModuleIds
      });

      // 2. If Sandbox / Mock mode is enabled
      if (orderData.mockMode) {
        const mockRes = await paymentService.mockSuccessPayment({
          planCode: 'pay_per_lesson',
          moduleId: targetModuleIds[0],
          moduleIds: targetModuleIds
        });

        if (mockRes.success) {
          setUnlockedSuccess(selectedLessons);
          onSuccess?.(mockRes);
        } else {
          setErrorMessage(mockRes.message || 'Payment simulation failed.');
        }
        setProcessingPayment(false);
        return;
      }

      // 3. Live Razorpay Flow
      const isLoaded = await paymentService.loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK could not be loaded. Please check your connection.');
      }

      const lessonCount = selectedLessons.length;
      const razorpayKey = orderData.keyId;


      const options = {
        key: razorpayKey,
        amount: orderData.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'Hoshiyaar Learning',
        description: `Unlock ${lessonCount} ${lessonCount > 1 ? 'Lessons' : 'Lesson'}`,
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
              planCode: 'pay_per_lesson',
              moduleId: targetModuleIds[0],
              moduleIds: targetModuleIds
            });

            if (verifyRes.success) {
              setUnlockedSuccess(selectedLessons);
              onSuccess?.(verifyRes);
            } else {
              setErrorMessage(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Verification error. Contact support.');
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('[Razorpay] Payment failed:', response?.error);
        setErrorMessage(response?.error?.description || response?.error?.reason || 'Payment failed. Please try again.');
        setProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      console.error('[LessonUnlockModal] Checkout error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to initialize payment.');
      setProcessingPayment(false);
    }
  };

  // 4. Initiate Payment for Entire Chapter (1-Year Pass)
  const handleUnlockEntireChapter = async () => {
    if (!selectedChapter?.id) return;
    setProcessingPayment(true);
    setErrorMessage('');

    try {
      // 1. Create order for pay_per_chapter
      const orderData = await paymentService.createOrder({
        planCode: 'pay_per_chapter',
        chapterId: selectedChapter.id
      });

      // 2. If Sandbox / Mock mode is enabled
      if (orderData.mockMode) {
        const mockRes = await paymentService.mockSuccessPayment({
          planCode: 'pay_per_chapter',
          chapterId: selectedChapter.id
        });

        if (mockRes.success) {
          setUnlockedSuccess(lessons);
          onSuccess?.(mockRes);
        } else {
          setErrorMessage(mockRes.message || 'Payment simulation failed.');
        }
        setProcessingPayment(false);
        return;
      }

      // 3. Live Razorpay Flow
      const isLoaded = await paymentService.loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK could not be loaded. Please check your connection.');
      }

      const razorpayKey = orderData.keyId;


      const options = {
        key: razorpayKey,
        amount: orderData.amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'Hoshiyaar Learning',
        description: `Unlock ${selectedChapter.title} (1-Year Pass)`,
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
              planCode: 'pay_per_chapter',
              chapterId: selectedChapter.id
            });

            if (verifyRes.success) {
              setUnlockedSuccess(lessons);
              onSuccess?.(verifyRes);
            } else {
              setErrorMessage(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Verification error. Contact support.');
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('[Razorpay] Payment failed:', response?.error);
        setErrorMessage(response?.error?.description || response?.error?.reason || 'Payment failed. Please try again.');
        setProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Chapter Checkout error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to initiate checkout.');
      setProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl relative border border-gray-100 overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔓</span>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">
                Unlock Lessons
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select one or multiple lessons below. Pay ₹{unitPrice} per lesson for lifetime access.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Success State */}
          {unlockedSuccess ? (
            <div className="text-center py-5 sm:py-6 space-y-4 animate-scale-up">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner animate-bounce">
                ✓
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                  {unlockedSuccess.length > 1 ? `${unlockedSuccess.length} Lessons Unlocked!` : 'Lesson Unlocked!'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto mt-1">
                  You now have permanent lifetime access to {unlockedSuccess.length > 1 ? 'the selected lessons' : `"${unlockedSuccess[0]?.title}"`} on your account.
                </p>
              </div>

              {/* List of unlocked lessons */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 max-h-48 overflow-y-auto text-left space-y-2 max-w-md mx-auto">
                {unlockedSuccess.map((mod, i) => (
                  <div key={mod._id || i} className="flex items-center justify-between text-xs py-2 px-3 bg-white rounded-xl border border-gray-100 shadow-xs">
                    <span className="font-bold text-gray-800 truncate mr-2">{mod.title}</span>
                    <span className="text-green-600 font-extrabold text-[11px] shrink-0 flex items-center gap-1">
                      <span>✓</span> Unlocked
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <button
                  onClick={() => {
                    onClose();
                    if (unlockedSuccess[0]?._id) {
                      navigate(`/learn/module/${unlockedSuccess[0]._id}/concept/0`);
                    }
                  }}
                  className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>🚀 Start {unlockedSuccess.length > 1 ? 'First Lesson' : 'Lesson Now'}</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(selectedChapter?.id ? `/learn?chapterId=${selectedChapter.id}` : '/learn');
                  }}
                  className="py-3 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-all active:scale-95"
                >
                  View Learning Path
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Class & Subject Header (Strictly Account Class) */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-900">Your Account Curriculum:</span>
                  <span className="bg-blue-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[11px]">
                    Class {studentClass} • Science
                  </span>
                </div>
                <span className="text-blue-700 font-semibold text-[11px] hidden sm:inline">
                  CBSE Curriculum
                </span>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Chapter Selection Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  1. Select Chapter
                </label>

                {loadingChapters ? (
                  <div className="py-3 px-4 bg-gray-50 rounded-2xl text-xs text-gray-400 border border-gray-200 animate-pulse">
                    Loading chapters for Class {studentClass}...
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="p-3.5 bg-gray-50 rounded-2xl text-center text-xs text-gray-500 border border-gray-200">
                    No published chapters found for Class {studentClass}.
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      data-testid="chapter-select-dropdown"
                      value={selectedChapter?.id || ''}
                      onChange={(e) => {
                        const found = chapters.find(c => String(c.id) === e.target.value);
                        if (found) setSelectedChapter(found);
                      }}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white text-gray-900 font-bold text-xs sm:text-sm appearance-none cursor-pointer transition-all shadow-xs pr-10"
                    >
                      {chapters.map((ch) => (
                        <option
                          key={ch.id}
                          value={ch.id}
                          disabled={ch.isComingSoon}
                        >
                          {ch.title} {ch.isComingSoon ? '(Coming Soon)' : ''}
                        </option>
                      ))}
                    </select>
                    {/* Custom down chevron icon */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Pay Per Chapter Callout & Action */}
              {selectedChapter && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                      <span>⭐</span>
                      <span className="truncate">Unlock Entire Chapter (1-Year Pass)</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                      Unlocks all {lessons.length} lessons + AI Exam Mode for 1 full year!
                    </p>
                  </div>
                  {isChapterPurchased ? (
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl border border-emerald-300 shrink-0">
                      ✓ Chapter Unlocked
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={processingPayment}
                      onClick={handleUnlockEntireChapter}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <span>Unlock Entire Chapter • ₹{chapterPrice} ⚡</span>
                    </button>
                  )}
                </div>
              )}

              {/* Lesson Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    2. Select Lessons to Unlock
                  </label>
                  {lockedLessons.length > 1 && (
                    <button
                      type="button"
                      data-testid="select-all-locked-btn"
                      onClick={toggleSelectAllLocked}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      {allLockedSelected ? 'Deselect All' : `Select All (${lockedLessons.length})`}
                    </button>
                  )}
                </div>

                {loadingLessons ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    Fetching lessons in {selectedChapter?.title}...
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-500">
                    No lessons found in this chapter yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {lessons.map((lesson, idx) => {
                      const isFreePreview = idx < freeLessonsCount;
                      const isPurchased = purchasedModuleSet.has(String(lesson._id)) || isChapterPurchased;
                      const isUnlocked = isFreePreview || isPurchased;
                      const isSelected = selectedLessons.some(l => l._id === lesson._id);

                      return (
                        <div
                          key={lesson._id}
                          data-testid={`lesson-card-${idx}`}
                          data-locked={!isUnlocked}
                          data-selected={isSelected}
                          onClick={() => {
                            if (!isUnlocked) {
                              toggleLessonSelection(lesson);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 select-none ${
                            isUnlocked
                              ? 'bg-gray-50/70 border-gray-200 cursor-not-allowed opacity-75'
                              : isSelected
                              ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/20 shadow-xs cursor-pointer'
                              : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Selection indicator / checkbox */}
                            <div className="shrink-0">
                              {isUnlocked ? (
                                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-black">
                                  ✓
                                </span>
                              ) : (
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                  isSelected 
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs' 
                                    : 'border-gray-300 bg-white hover:border-blue-400'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-gray-400">
                                  Lesson {idx + 1}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                {lesson.title}
                              </h4>
                            </div>
                          </div>

                          {/* Right Badge */}
                          <div className="shrink-0 text-right">
                            {isFreePreview ? (
                              <span className="inline-block bg-green-100 text-green-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                                Free Preview
                              </span>
                            ) : isPurchased ? (
                              <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                                Unlocked
                              </span>
                            ) : (
                              <span className={`inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-amber-100 text-amber-900'
                              }`}>
                                {isSelected ? `✓ ₹${unitPrice}` : `₹${unitPrice}`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer Action Bar */}
        {!unlockedSuccess && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-center sm:text-left min-w-0">
              {selectedLessons.length > 0 ? (
                <div>
                  <div className="text-xs text-gray-500 font-medium">
                    Selected: <span className="font-bold text-gray-900">{selectedLessons.length} {selectedLessons.length === 1 ? 'lesson' : 'lessons'}</span> • <span className="text-blue-600 font-black">₹{totalPrice}</span> total
                  </div>
                  <div className="text-xs font-semibold text-gray-700 truncate max-w-xs mt-0.5">
                    {selectedLessons.map(l => l.title).join(', ')}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500 font-medium">
                  👆 Select one or more locked lessons above
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <a
                href={`https://wa.me/918310532323?text=${encodeURIComponent(
                  `Hi! I would like to discuss unlocking lessons in "${selectedChapter?.title || 'Chapter'}" on Hoshiyaar.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-3 px-3.5 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-bold text-xs rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                title="Discuss on WhatsApp"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
              <button
                data-testid="unlock-pay-button"
                disabled={selectedLessons.length === 0 || processingPayment}
                onClick={handleProceedToPayment}
                className={`w-full sm:w-auto py-3 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  selectedLessons.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : processingPayment
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-blue-500/20'
                }`}
              >
                {processingPayment ? (
                  <span>Processing...</span>
                ) : (
                  <span>
                    {selectedLessons.length > 1 
                      ? `Unlock ${selectedLessons.length} Lessons for ₹${totalPrice}` 
                      : selectedLessons.length === 1 
                      ? `Unlock 1 Lesson for ₹${totalPrice}` 
                      : 'Select Lessons to Unlock'}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
