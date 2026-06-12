import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import reviewService from '../../../services/reviewService.js';
import curriculumService from '../../../services/curriculumService.js';
import { useReview } from '../../../context/ReviewContext.jsx';
import BackButton from '../../ui/BackButton.jsx';

import { PathNode, OrganicPathSvg, getWaveOffset, StartBadge } from '../pages/LearnDashboard.jsx';

export default function RevisionList() {
  const [params] = useSearchParams();
  const chapterId = params.get('chapterId') || '';
  const moduleId = params.get('moduleId') || '';
  const unitId = params.get('unitId') || '';
  const { user } = useAuth();
  const { reset, add } = useReview();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState([]);
  
  // Chapter View state
  const [chapterName, setChapterName] = useState('');
  const [unitsList, setUnitsList] = useState([]);
  const [unitDefaults, setUnitDefaults] = useState({});
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const [isMobileLayout, setIsMobileLayout] = useState(window.innerWidth < 768);
  const rowSpacing = 110;

  useEffect(() => {
    const handleResize = () => setIsMobileLayout(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?._id) return;
      setLoading(true);

      // Handle direct Unit ID jump (e.g. from RevisionStar on LearnDashboard)
      if (unitId) {
        try {
          const modsResponse = await curriculumService.listModulesByUnit(unitId).catch(() => null);
          const mods = modsResponse?.data || [];
          const unitMediaItems = [];

          for (const m of mods) {
            const itemsResponse = await curriculumService.listItems(m._id).catch(() => null);
            const items = itemsResponse?.data || [];
            
            items.forEach((item, index) => {
              const actualType = item.type || 'concept';
              const isVideo = actualType === 'youtube' || (actualType === 'concept' && item.videoUrl);
              const isComic = actualType === 'comic' || (actualType === 'concept' && Array.isArray(item.comicUrls) && item.comicUrls.length > 0);
              
              if (isVideo || isComic) {
                unitMediaItems.push({
                  moduleId: m._id,
                  lessonIndex: index,
                  order: unitMediaItems.length,
                  type: isComic ? 'comic' : 'video',
                  question: item.title || '',
                  videoUrl: item.videoUrl,
                  comicUrls: item.comicUrls,
                  images: item.images,
                  text: item.text,
                  options: item.options,
                  answer: item.answer,
                });
              }
            });
          }
          startReviewDirect(unitMediaItems);
        } catch (_) {
          setLoading(false);
        }
        return;
      }

      // Handle direct Module ID jump
      if (moduleId) {
        try {
          const itemsResponse = await curriculumService.listItems(moduleId).catch(() => null);
          const items = itemsResponse?.data || [];
          const modMediaItems = [];
          
          items.forEach((item, index) => {
            const actualType = item.type || 'concept';
            const isVideo = actualType === 'youtube' || (actualType === 'concept' && item.videoUrl);
            const isComic = actualType === 'comic' || (actualType === 'concept' && Array.isArray(item.comicUrls) && item.comicUrls.length > 0);
            
            if (isVideo || isComic) {
              modMediaItems.push({
                moduleId: moduleId,
                lessonIndex: index,
                order: modMediaItems.length,
                type: isComic ? 'comic' : 'video',
                question: item.title || '',
                videoUrl: item.videoUrl,
                comicUrls: item.comicUrls,
                images: item.images,
                text: item.text,
                options: item.options,
                answer: item.answer,
              });
            }
          });
          startReviewDirect(modMediaItems);
        } catch (_) {
          setLoading(false);
        }
        return;
      }

      // Subject Level View
      if (!chapterId) {
        try {
          const subj = user?.subject || 'Science';
          const brd = user?.board || 'CBSE';
          const chResp = await curriculumService.listChapters(brd, subj);
          setChapters(chResp?.data || []);
        } catch (_) {
          setChapters([]);
        }
        setLoading(false);
        return;
      }

      // Chapter Level View: Units on Winding Path
      try {
        // Fetch chapter title
        const chs = await curriculumService.listChapters('CBSE', user?.subject || 'Science');
        const chObj = (chs?.data || []).find(c => c._id === chapterId);
        if (chObj?.title) setChapterName(chObj.title);

        const defaultsByUnit = {};

        // Fetch units
        const un = await curriculumService.listUnits(chapterId);
        let units = un?.data || [];
        
        let validUnits = [];

        if (units.length > 0) {
          // Check curriculum media for each unit
          for (const u of units) {
            const modsResponse = await curriculumService.listModulesByUnit(u._id).catch(() => null);
            const mods = modsResponse?.data || [];
            if (mods.length === 0) continue;

            const unitMediaItems = [];

            // Fetch items for each module sequentially to preserve order
            for (const m of mods) {
              const itemsResponse = await curriculumService.listItems(m._id).catch(() => null);
              const items = itemsResponse?.data || [];
              
              items.forEach((item, index) => {
                const actualType = item.type || 'concept';
                const isVideo = actualType === 'youtube' || (actualType === 'concept' && item.videoUrl);
                const isComic = actualType === 'comic' || (actualType === 'concept' && Array.isArray(item.comicUrls) && item.comicUrls.length > 0);
                
                if (isVideo || isComic) {
                  unitMediaItems.push({
                    moduleId: m._id,
                    lessonIndex: index,
                    order: unitMediaItems.length,
                    type: isComic ? 'comic' : 'video',
                    question: item.title || '',
                    videoUrl: item.videoUrl,
                    comicUrls: item.comicUrls,
                    images: item.images,
                    text: item.text,
                    options: item.options,
                    answer: item.answer,
                  });
                }
              });
            }

            if (unitMediaItems.length > 0) {
              defaultsByUnit[u._id] = unitMediaItems;
              validUnits.push(u);
            }
          }
        } else {
          // Fallback: If no units, we would need to fetch all modules for the chapter.
          // Since all chapters should have units, we can skip for now.
        }

        setUnitDefaults(defaultsByUnit);
        setUnitsList(validUnits);

      } catch (_) {
        setUnitsList([]);
      }
      
      setLoading(false);
    };
    load();
  }, [user, chapterId, moduleId, unitId]);

  const startReviewDirect = (defaultsList) => {
    reset();
    const sortedItems = [...(defaultsList || [])]
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    
    sortedItems.forEach((d) => {
      const mid = String(d.moduleId || '');
      const foundIdx = Number.isInteger(d.lessonIndex) ? Number(d.lessonIndex) : -1;
      
      if (foundIdx >= 0 && mid) {
        const revType = String(d.type || 'statement');
        const routeType = revType === 'concept' ? 'statement' : 
                         revType === 'fill-in-the-blank' ? 'fill-in-the-blank' :
                         revType === 'multiple-choice' ? 'multiple-choice' :
                         revType === 'rearrange' ? 'rearrange' :
                         revType === 'statement' ? 'statement' : 'statement';
        
        add({ 
          questionId: `${mid}_${foundIdx}_${routeType}`, 
          moduleNumber: mid, 
          index: String(foundIdx), 
          type: routeType,
          _order: Number(d.order || 0),
          _source: 'default',
          _lessonIndex: Number(foundIdx),
          _revisionData: {
            type: d.type,
            question: d.question,
            text: d.text,
            answer: d.answer,
            options: d.options || [],
            words: d.words || [],
            images: d.images || []
          }
        });
      }
    });

    if (sortedItems.length > 0) {
      setTimeout(() => {
        navigate('/review-round', { replace: true });
      }, 50);
    } else {
      setLoading(false); // Let the UI show an empty state or allow backing out
    }
  };

  const startReviewForUnit = (uId) => {
    const uDefaults = unitDefaults[uId] || [];
    startReviewDirect(uDefaults);
  };

  const localLineHeight = Math.max(160, unitsList.length * rowSpacing + 120);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F2FF] to-white py-10 px-6 relative">
      <BackButton className="fixed left-4 top-4 z-50" />
      <div className="max-w-5xl mx-auto mt-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#7E22CE] tracking-wide">
            Super Important Revision!
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-purple-900/80">
            {!chapterId ? 'Select a Chapter to revise' : 'Revision Journey'}
            {chapterId && chapterName && (
              <span className="ml-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-2xl bg-purple-100 text-purple-800 font-bold text-sm sm:text-base">
                {chapterName}
              </span>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-bold text-purple-800 tracking-wider">Loading your questions...</p>
          </div>
        ) : moduleId ? (
          <div className="text-center font-bold text-gray-500 text-lg mt-10">No revision questions found for this module.</div>
        ) : !chapterId ? (
          // Subject-level index: show chapters (purple UI)
          (() => {
            if ((chapters || []).length === 0) return <div className="text-center font-bold text-gray-500 text-lg mt-10">No chapters found.</div>;
            return (
              <ul className="space-y-4 sm:space-y-6">
                {chapters.map((ch) => (
                  <li key={ch._id} className="w-full p-4 sm:p-6 rounded-3xl border-4 border-purple-300 bg-white shadow-[0_10px_0_0_rgba(147,51,234,0.18)] flex items-center justify-between">
                    <div className="pr-4">
                      <div className="text-lg sm:text-xl font-extrabold text-purple-800">{ch.title}</div>
                      <div className="text-sm text-purple-900/70 mt-1">Chapter</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => navigate(`/revision?chapterId=${encodeURIComponent(ch._id)}`)} className="px-4 py-2 sm:px-5 sm:py-3 rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-white text-sm sm:text-base font-extrabold shadow-[0_6px_0_0_rgba(0,0,0,0.15)] transition-colors">
                        Explore
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            );
          })()
        ) : (
          // Chapter-level index: show winding path of UNITS!
          (() => {
            if ((unitsList || []).length === 0) return <div className="text-center font-bold text-gray-500 text-lg mt-10">No recommended questions in this chapter! You are all caught up! 🎉</div>;
            return (
              <div className="flex flex-col items-center">
                <div className={`relative w-full max-w-md ${isMobileLayout ? 'pb-10' : 'pb-28'} pt-12`}>
                  {/* Path Container */}
                  <div className="relative w-full" style={{ minHeight: `${localLineHeight}px` }}>
                    <OrganicPathSvg 
                      nodesCount={unitsList.length} 
                      color="#D8B4FE" 
                      rowSpacing={rowSpacing} 
                      isMobile={isMobileLayout} 
                    />

                    {unitsList.map((unit, index) => {
                      const offset = getWaveOffset(index, isMobileLayout);
                      const isHovered = hoveredIndex === index;
                      const qCount = unitDefaults[unit._id]?.length || 0;

                      return (
                        <div
                          key={unit._id}
                          className="absolute w-full flex justify-center items-center px-4"
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          style={{
                            top: index * rowSpacing + 60,
                            zIndex: isHovered ? 50 : 10 + (unitsList.length - index),
                            height: 0
                          }}
                        >
                          <div className="relative group">
                            <PathNode
                              status="active"
                              disabled={false}
                              color="#A855F7"
                              offset={offset}
                              onClick={() => startReviewForUnit(unit._id)}
                            >
                              {isHovered && <StartBadge color="#9333EA" />}
                            </PathNode>

                            {/* Always-Visible Label (3D Box Styling) */}
                            <div 
                              onClick={() => startReviewForUnit(unit._id)}
                              className={`absolute top-1/2 -translate-y-1/2 left-full flex items-center ml-[6px] md:ml-[24px] cursor-pointer group/label`}
                              style={{ transform: `translateX(${offset}px) translateY(-50%)` }}
                            >
                              <div className="relative w-[120px] md:w-[150px] h-auto">
                                <div className="absolute inset-0 translate-y-[4px] rounded-2xl bg-[#7E22CE]" />
                                <div className="relative px-4 py-3 bg-[#A855F7] border-2 border-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-transform group-hover/label:-translate-y-1 active:translate-y-1 flex flex-col items-center justify-center">
                                  <span className="text-white font-extrabold text-[13px] md:text-[15px] leading-tight text-center drop-shadow-sm line-clamp-2">
                                    {(unit.title && unit.title.toLowerCase() !== 'unit') ? unit.title : `Unit ${index + 1}`}
                                  </span>
                                  <span className="text-white/80 font-bold text-[10px] md:text-[11px] mt-1">
                                    {qCount} Questions
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
