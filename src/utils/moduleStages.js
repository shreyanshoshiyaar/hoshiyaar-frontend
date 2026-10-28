/**
 * Utility to calculate learning stages for a module.
 * Groups consecutive items into pedagogical stages:
 * - Comic sequence = Stage 1 (e.g., "MISSION INTEL")
 * - Blackboard sequence = Stage 2 (e.g., "BOARD TIME")
 * - Practice questions = Stage 3 (e.g., "PRACTICE")
 */

import { isMissionCompleteItem } from './missionCompleteHelper.js';

export function getModuleStages(items = []) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { stages: [], totalStages: 1 };
  }

  const stages = [];
  let currentStage = null;
  let insideBoard = false;

  items.forEach((it, idx) => {
    if (isMissionCompleteItem(it)) return;

    const rawType = String(it.type || '').toLowerCase().trim();
    const itemId = String(it.itemId || '');

    let stageType = 'concept';
    let defaultTitle = 'CONCEPT';

    // Board detection:
    const isBoardRoot = itemId.includes('.B') || rawType === 'blackboard' || rawType === 'board' || itemId.includes('BQ') || itemId.includes('.BQ');
    const isComicItem = itemId.includes('.P') || rawType === 'comic' || (!insideBoard && rawType === 'story');
    const isPracticeItem = ['multiple-choice', 'fill-in-the-blank', 'rearrange', 'descriptive'].includes(rawType);

    if (isBoardRoot) {
      insideBoard = true;
      stageType = 'blackboard';
      defaultTitle = 'BOARD TIME';
    } else if (insideBoard && (rawType.startsWith('engagement') || rawType === 'story' || itemId.includes('.B') || itemId.includes('EQ') || itemId.includes('.EQ') || itemId.includes('BQ') || itemId.includes('.BQ') || it.inputJson?.options)) {
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
      insideBoard = false;
      stageType = 'concept';
      defaultTitle = 'CONCEPT';
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
    totalStages: Math.max(1, stages.length)
  };
}

/**
 * Given the raw item index in the module, determine the stage number (1-based)
 * and total stages.
 */
export function getStageInfoForIndex(items = [], currentIndex = 0) {
  const { stages, totalStages } = getModuleStages(items);
  if (!stages || stages.length === 0) {
    return {
      stageNumber: 1,
      totalStages: 1,
      stageIndex: 0,
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
  return {
    stageNumber: matchedStageIdx + 1,
    stageIndex: matchedStageIdx,
    totalStages,
    stageTitle: s.title,
    stageType: s.type,
    itemCountInStage: s.itemCount,
    stageStartIndex: s.startIndex,
    stageEndIndex: s.endIndex
  };
}
