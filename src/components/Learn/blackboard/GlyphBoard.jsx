import React, { useState, useEffect, useRef, useMemo } from 'react';
import Glyph from './glyphEngine';
import { renderGlyphSequence, getGlyphTotalSteps, BlackboardAnimationStyles } from './glyphDictionary';

/**
 * GlyphBoard Canvas Component
 * 
 * - Single chalkboard canvas that explains concepts visually like a school blackboard.
 * - Plays vector SVG chalkboard actions over time using the Glyph engine.
 * - Supports animated step actions (path, draw, place, pulse, zoom, bolus movement).
 * - Backward-compatible with glyph sequences (e.g. chapati -> teeth) and single glyph codes.
 * - Apple-style classy black card with glowing vector strokes and chalk texture.
 */
export default function GlyphBoard({
  currentLine = null,
  cardLines = [],
  stepJson = null,
  initPieces = null,
  activeLineIndex = 0,
  cardTitle = "",
  cardIndex = 0,
  replayKey = 0,
  animKey = 0,
  isPaused = false,
  onStepEnded = null,
  scrubTime = null,
  // Desktop (lg+) only: stretch to the height of the parent column instead of 50% of the screen
  fillHeight = false,
  // Desktop (lg+) only: no drop shadow/glow around the board (the concept card shows it on a light page)
  noShadow = false,
  // Extra classes for the board card, e.g. a height cap from the page around it
  cardClassName = '',
}) {
  const svgContainerRef = useRef(null);
  const animFrameRef = useRef(null);
  const currentTRef = useRef(0);
  const targetEndTRef = useRef(1);
  const renderAtTRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const [isFinished, setIsFinished] = useState(false);
  const [revealedCount, setRevealedCount] = useState(1);
  const timersRef = useRef([]);

  // Extract step JSON if available (either passed directly or via currentLine)
  const activeStepJson = useMemo(() => {
    if (stepJson && (stepJson.actions || stepJson.title)) return stepJson;
    if (currentLine?.inputJson && (currentLine.inputJson.actions || currentLine.inputJson.title)) {
      return currentLine.inputJson;
    }
    if (currentLine?.row?.Input) {
      return Glyph.parseStepInput(currentLine.row.Input, currentLine.row.Text);
    }
    return null;
  }, [stepJson, currentLine]);

  const hasActions = Boolean(activeStepJson?.actions && activeStepJson.actions.length > 0);

  const glyphCode = currentLine?.glyphCode || currentLine?.answer || currentLine?.glyph || "";
  const lineLabel = currentLine?.text || currentLine?.statement || cardTitle || "";
  const totalLegacySteps = getGlyphTotalSteps(glyphCode);
  const totalLines = Array.isArray(cardLines) && cardLines.length > 0 ? cardLines.length : (activeStepJson?.say?.length || 1);

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  /**
   * Helper: Calculates the exact time boundary [start, end] for lineIdx.
   * Glyphs belonging to this line animate up to 'end' and HOLD until the next line begins!
   */
  const getLineTimeRange = (lineIdx) => {
    if (!activeStepJson) return { start: 0, end: 1 };
    const duration = Glyph.stepDuration(activeStepJson);
    const sayList = activeStepJson.say || [];

    if (sayList.length > 0) {
      const getT = (item) => Array.isArray(item) ? Number(item[0]) : Number(item?.at ?? 0);

      let startT = 0;
      if (lineIdx < sayList.length) {
        startT = getT(sayList[lineIdx]);
      } else if (sayList.length > 0) {
        startT = getT(sayList[sayList.length - 1]);
      }

      let endT = duration;
      if (lineIdx + 1 < sayList.length) {
        endT = getT(sayList[lineIdx + 1]);
      } else {
        endT = duration;
      }

      return {
        start: Math.max(0, startT),
        end: Math.max(startT + 0.3, endT)
      };
    }

    // Fallback: divide step duration across lines proportionally
    const lineSlice = duration / Math.max(1, totalLines);
    return {
      start: lineIdx * lineSlice,
      end: lineIdx >= totalLines - 1 ? duration : (lineIdx + 1) * lineSlice
    };
  };

  // 1. Vector Action Timeline Loop (Runs on card change or replay)
  useEffect(() => {
    clearTimers();
    setIsFinished(false);

    if (!hasActions || !activeStepJson) {
      return;
    }

    const duration = Glyph.stepDuration(activeStepJson);
    currentTRef.current = 0;

    const renderAtT = (t) => {
      if (!svgContainerRef.current) return;
      try {
        const pieces = Glyph.stateAt(activeStepJson, t, initPieces);
        let extra = '';
        if (activeStepJson._empty) {
          extra = `<text x="80" y="50" text-anchor="middle" class="glabel" style="font-size:5px;fill:#56718C">Chalkboard drawing in progress</text>`;
        }
        const svgContent = Glyph.render(pieces, t, extra, t);
        svgContainerRef.current.innerHTML = svgContent;
      } catch (err) {
        console.warn('Error rendering glyph frame at t=' + t, err);
      }
    };
    renderAtTRef.current = renderAtT;

    // If interactive scrubbing is active, immediately render at scrubTime and avoid auto-loop
    if (scrubTime !== null && scrubTime !== undefined) {
      currentTRef.current = scrubTime;
      renderAtT(scrubTime);
      return () => clearTimers();
    }

    // Render frame at t=0
    renderAtT(0);

    const initialRange = getLineTimeRange(activeLineIndex);
    targetEndTRef.current = initialRange.end;

    if (isPaused) {
      return;
    }

    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!isPaused) {
        const targetEnd = targetEndTRef.current;

        // Animate up to the current line's target end time, then pause and hold!
        if (currentTRef.current < targetEnd) {
          currentTRef.current += dt * 0.70;
          if (currentTRef.current >= targetEnd) {
            currentTRef.current = targetEnd;
          }
          renderAtT(currentTRef.current);
        }

        if (currentTRef.current >= duration) {
          setIsFinished(true);
          renderAtT(duration);
          if (onStepEnded) onStepEnded();
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTime = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => clearTimers();
  }, [hasActions, activeStepJson, initPieces, cardIndex, replayKey, isPaused, scrubTime]);

  // Handle interactive manual scrubbing (e.g. from slider widget)
  useEffect(() => {
    if (scrubTime !== null && scrubTime !== undefined && hasActions && activeStepJson) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      currentTRef.current = scrubTime;
      renderAtTRef.current?.(scrubTime);
    }
  }, [scrubTime, hasActions, activeStepJson]);

  // Synchronize board actions when activeLineIndex advances or jumps
  // ONLY reveals glyphs up to the current line!
  useEffect(() => {
    if (!hasActions || !activeStepJson || (scrubTime !== null && scrubTime !== undefined)) return;

    const range = getLineTimeRange(activeLineIndex);
    targetEndTRef.current = range.end;

    // If student navigated backward, snap board to that line's completed drawing
    if (currentTRef.current > range.end) {
      currentTRef.current = range.end;
      renderAtTRef.current?.(range.end);
    } 
    // If student jumped forward, ensure all prior pieces are rendered
    else if (currentTRef.current < range.start) {
      currentTRef.current = range.start;
      renderAtTRef.current?.(range.start);
    }
  }, [activeLineIndex, hasActions, activeStepJson]);

  // 2. Legacy Sequence Timing Effect:
  // Synchronizes the exact revealed glyph count with the active line!
  useEffect(() => {
    if (hasActions) return;
    if (!glyphCode || totalLegacySteps <= 1) {
      setRevealedCount(1);
      return;
    }

    // Line 0 -> Step 1, Line 1 -> Step 2, Line 2 -> Step 3
    const targetStep = Math.min(totalLegacySteps, Math.max(1, activeLineIndex + 1));
    setRevealedCount(targetStep);
  }, [activeLineIndex, hasActions, glyphCode, totalLegacySteps, cardIndex, replayKey]);

  // Click on the board to reveal all elements immediately without waiting
  const handleBoardClick = () => {
    if (isPaused) return;

    if (hasActions && activeStepJson) {
      clearTimers();
      const duration = Glyph.stepDuration(activeStepJson);
      try {
        const pieces = Glyph.stateAt(activeStepJson, duration, initPieces);
        if (svgContainerRef.current) {
          svgContainerRef.current.innerHTML = Glyph.render(pieces, duration, '', duration);
        }
      } catch (e) {}
      setIsFinished(true);
      if (onStepEnded) onStepEnded();
    } else {
      clearTimers();
      setRevealedCount(totalLegacySteps);
    }
  };

  // Determine single glyph preview if code exists in library
  const isSingleKnownGlyph = !hasActions && glyphCode && Glyph.known(glyphCode.trim());
  const singleGlyphPreviewSvg = useMemo(() => {
    if (isSingleKnownGlyph) {
      const g = Glyph.LIB[glyphCode.trim()] || { name: glyphCode.trim() };
      return Glyph.preview(g);
    }
    return '';
  }, [isSingleKnownGlyph, glyphCode]);

  return (
    <div className={`w-full flex flex-col items-center select-none py-0.5 sm:py-1 ${fillHeight ? 'lg:h-full' : ''}`}>
      <BlackboardAnimationStyles />

      {/* Apple-Style Classy Blackboard Card - Responsively scaled so diagrams are clear & prominent with room for dialogue below */}
      <div 
        onClick={handleBoardClick}
        title="Click to reveal complete drawing"
        className={`w-full max-w-2xl sm:max-w-3xl md:max-w-4xl h-[33dvh] min-h-[220px] max-h-[320px] sm:h-[38dvh] sm:min-h-[260px] sm:max-h-[380px] md:h-[42dvh] md:min-h-[320px] md:max-h-[460px] lg:h-[50dvh] lg:min-h-[380px] lg:max-h-[560px] flex flex-col items-center justify-center relative rounded-[18px] sm:rounded-[26px] overflow-hidden p-2 sm:p-3.5 transition-all duration-300 cursor-pointer shadow-xl${noShadow ? ' lg:!shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_0_40px_rgba(0,0,0,0.8)]' : ''}${fillHeight ? ' lg:!h-full lg:!max-h-none' : ''} ${cardClassName}`}
        style={{
          background: 'radial-gradient(130% 130% at 50% 15%, #0B131E 0%, #070B11 55%, #030508 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          boxShadow: `
            0 0 0 1px rgba(255, 255, 255, 0.08),
            0 0 30px rgba(124, 211, 255, 0.12),
            0 24px 48px rgba(0, 0, 0, 0.9),
            inset 0 1px 1px rgba(255, 255, 255, 0.25),
            inset 0 0 40px rgba(0, 0, 0, 0.8)
          `
        }}
      >
        {/* Subtle chalkboard top ambient sheen */}
        <div 
          className="absolute inset-x-0 top-0 h-28 pointer-events-none opacity-25"
          style={{
            background: 'linear-gradient(180deg, rgba(124, 211, 255, 0.12) 0%, transparent 100%)'
          }}
        />

        {/* Subtle chalk dust vignette */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.2) 0%, transparent 75%)'
          }}
        />

        {/* Canvas Display */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {hasActions ? (
            /* 1. Dynamic Vector Chalkboard Drawing via Glyph Engine */
            <div className="w-full h-full flex items-center justify-center">
              <svg 
                ref={svgContainerRef}
                viewBox={`0 0 ${Glyph.W} ${Glyph.H}`}
                role="img" 
                aria-label="Board drawing"
                className="w-full h-full max-h-full object-contain overflow-visible"
              />
            </div>
          ) : isSingleKnownGlyph ? (
            /* 2. Single Library Glyph Preview */
            <div 
              className="w-full h-full flex items-center justify-center max-h-full [&>svg]:max-h-full [&>svg]:w-auto object-contain"
              dangerouslySetInnerHTML={{ __html: singleGlyphPreviewSvg }}
            />
          ) : glyphCode ? (
            /* 3. Multi-Element Glyph Sequence */
            <div className="w-full h-full flex items-center justify-center max-h-full [&>svg]:max-h-full [&>svg]:w-auto object-contain">
              {renderGlyphSequence(glyphCode, true, revealedCount, `${cardIndex}_${replayKey}`)}
            </div>
          ) : (
            /* 4. Fallback to Chalk Hand-drawn Text */
            <div 
              style={{ 
                fontFamily: "var(--f-hand, 'Patrick Hand', cursive, sans-serif)",
                animation: 'swipeFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
              className="text-white text-base sm:text-lg font-normal tracking-normal text-center px-4"
            >
              {lineLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
