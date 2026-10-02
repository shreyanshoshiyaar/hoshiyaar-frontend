import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import authService from '../../services/authService.js';
import TeacherDashboard from '../teacher/TeacherDashboard.jsx';
import StudentHomeworkPage from '../student/StudentHomeworkPage.jsx';

export default function HomeworkHub({ isMobileLayout }) {
  const { user, updateUser } = useAuth();
  const [currentRole, setCurrentRole] = useState(user?.role || 'user');

  // Sync latest role from backend so assignments from admin panel take effect immediately
  useEffect(() => {
    if (!user?._id) return;
    let isMounted = true;
    authService.getUser(user._id)
      .then(res => {
        if (!isMounted) return;
        const freshUser = res?.data?.user || res?.data;
        const freshRole = freshUser?.role;
        if (freshRole) {
          setCurrentRole(freshRole);
          if (freshRole !== user.role && typeof updateUser === 'function') {
            updateUser({ ...user, ...freshUser, role: freshRole });
          }
        }
      })
      .catch(err => {
        console.warn('[HomeworkHub] Could not sync user role from backend:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  const isTeacher = currentRole === 'teacher' || currentRole === 'admin';

  return (
    <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
            <span>📝</span>
            <span>Home Work</span>
          </span>
          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
            isTeacher ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-[#1E65FA] border border-blue-200'
          }`}>
            {isTeacher ? '👨‍🏫 Teacher Portal' : '🎒 My Assignments'}
          </span>
        </div>

        {user?.school && user.school !== 'Self Study / Individual' && (
          <span className="text-xs font-bold text-slate-500 truncate max-w-[200px]" title={user.school}>
            🏫 {user.school}
          </span>
        )}
      </div>

      {/* Render View Based on Backend Role */}
      {isTeacher ? (
        <TeacherDashboard embedded={true} />
      ) : (
        <StudentHomeworkPage user={user} />
      )}
    </div>
  );
}
