import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { canGuestOpenLesson, recordGuestLesson } from '../../utils/guestAccess.js';
import GuestVerifyModal from '../forms/GuestVerifyModal.jsx';

// Wraps lesson pages for guest users: the first 5 lessons (any chapters) play,
// a 6th new lesson asks the guest to verify their number first. Only rendered when user.isGuest.
export default function GuestLessonGate({ userId, moduleId, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const allowed = useMemo(() => canGuestOpenLesson(userId, moduleId), [userId, moduleId]);

  useEffect(() => {
    if (allowed) recordGuestLesson(userId, moduleId);
  }, [allowed, userId, moduleId]);

  if (allowed) return children;

  const chapterId = new URLSearchParams(location.search).get('chapterId');
  return (
    <div className="fixed inset-0 bg-[#F0F6FF]">
      <GuestVerifyModal
        onClose={() => navigate(chapterId ? `/learn?chapterId=${encodeURIComponent(chapterId)}` : '/learn', { replace: true })}
      />
    </div>
  );
}
