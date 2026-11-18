/**
 * Utility to calculate learning stages for a module.
 * Groups consecutive items into pedagogical stages:
 * - Comic sequence = Stage 1 (e.g., "MISSION INTEL")
 * - Blackboard sequence = Stage 2 (e.g., "BOARD TIME")
 * - Practice questions = Stage 3 (e.g., "PRACTICE")
 * Concept cards (journey map, summary cards, brain breaks) are not stages of their own: they sit between
 * sections, and counting each one made a lesson look like it had many more stages than it does.
 */

// Board items are C1.B2, C1.B2.1, C1.BQ3 ...; brain-break cards (C1.BR2) are concept cards, not boards
const BOARD_ID = /\.B\d|\.?BQ\d/;

import { isMissionCompleteItem } from './missionCompleteHelper.js';

export function getModuleStages(items = []) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { stages: [], totalStages: 1 };
  }

  const stages = [];
  const conceptIndices = [];
  let currentStage = null;
  let insideBoard = false;

  items.forEach((it, idx) => {
    if (isMissionCompleteItem(it)) return;

    const rawType = String(it.type || '').toLowerCase().trim();
    const itemId = String(it.itemId || '');

    let stageType = 'concept';
    let defaultTitle = 'CONCEPT';

    // Board detection:
    const isBoardRoot = BOARD_ID.test(itemId) || rawType === 'blackboard' || rawType === 'board';
    const isComicItem = itemId.includes('.P') || rawType === 'comic' || (!insideBoard && rawType === 'story');
    const isPracticeItem = ['multiple-choice', 'fill-in-the-blank', 'rearrange', 'descriptive'].includes(rawType);

    if (isBoardRoot) {
      insideBoard = true;
      stageType = 'blackboard';
      defaultTitle = 'BOARD TIME';
    } else if (insideBoard && rawType !== 'concept' && (rawType.startsWith('engagement') || rawType === 'story' || BOARD_ID.test(itemId) || itemId.includes('EQ') || it.inputJson?.options)) {
      // Lines, chants, or engagement questions within the board remain in BOARD TIME
      stageType = 'blackboard';
      defaultTitle = 'BOARD TIME';
    } else if (isComicItem) {
      insideBoard = false;
      stageType = 'comic';
      defaultTitle = 'MISSION INTEL';
    } else if (isPracticeItem) {
      insideBoard = false;
      stageType = 'practice';
      defaultTitle = 'PRACTICE';
    } else if (rawType.includes('didyouknow') || rawType.includes('remember')) {
      insideBoard = false;
      stageType = 'didyouknow';
      defaultTitle = 'REMEMBER';
    } else if (rawType.startsWith('engagement')) {
      insideBoard = false;
      stageType = 'engagement';
      defaultTitle = 'CHALLENGE';
    } else {
      // A concept card: not a stage, and it doesn't end the board it sits in
      conceptIndices.push(idx);
      return;
    }

    // Start a new stage when the group changes
    if (!currentStage || currentStage.type !== stageType) {
      currentStage = {
        type: stageType,
        title: it.cardTitle || defaultTitle,
        startIndex: idx,
        endIndex: idx,
        itemCount: 1
      };
      stages.push(currentStage);
    } else {
      currentStage.endIndex = idx;
      currentStage.itemCount++;
    }
  });

  return {
    stages,
    conceptIndices,
    totalStages: Math.max(1, stages.length)
  };
}

/**
 * Given the raw item index in the module, determine the stage number (1-based)
 * and total stages.
 */
export function getStageInfoForIndex(items = [], currentIndex = 0) {
  const { stages, totalStages, conceptIndices = [] } = getModuleStages(items);

  // A concept card keeps the stage number of the section around it, so the header and progress bar never go
  // backwards: after a section it shows that section as done; before the first section, the start of it
  if (stages.length > 0 && conceptIndices.includes(currentIndex)) {
    let before = -1;
    stages.forEach((st, i) => { if (st.startIndex < currentIndex) before = i; });
    const host = before >= 0 ? stages[before] : stages[0];
    const count = Math.max(1, host.itemCount);
    return {
      stageNumber: (before >= 0 ? before : 0) + 1,
      stageIndex: before >= 0 ? before : 0,
      stageIndexInStage: before >= 0 ? count - 1 : 0,
      totalStages,
      stageTitle: 'CONCEPT',
      stageType: 'concept',
      itemCountInStage: count,
      // LessonHeader works out the position as currentIndex - stageStartIndex
      stageStartIndex: before >= 0 ? currentIndex - (count - 1) : currentIndex,
      stageEndIndex: currentIndex
    };
  }

  if (!stages || stages.length === 0) {
    return {
      stageNumber: 1,
      totalStages: 1,
      stageIndex: 0,
      stageIndexInStage: 0,
      stageTitle: 'STAGE 1',
      stageType: 'concept',
      itemCountInStage: 1,
      stageStartIndex: 0,
      stageEndIndex: 0
    };
  }

  let matchedStageIdx = 0;
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (currentIndex >= s.startIndex && currentIndex <= s.endIndex) {
      matchedStageIdx = i;
      break;
    }
    if (currentIndex > s.endIndex) {
      matchedStageIdx = i;
    }
  }

  const s = stages[matchedStageIdx];
  const stageIndexInStage = Math.max(0, currentIndex - s.startIndex);
  return {
    stageNumber: matchedStageIdx + 1,
    stageIndex: matchedStageIdx,
    stageIndexInStage,
    totalStages,
    stageTitle: s.title,
    stageType: s.type,
    itemCountInStage: s.itemCount,
    stageStartIndex: s.startIndex,
    stageEndIndex: s.endIndex
  };
}
