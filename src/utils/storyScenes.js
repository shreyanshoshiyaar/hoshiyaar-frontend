import { getApiBase } from './apiBase.js';

// Story / comic lessons: how items become pages of spoken lines, and the voice URL for each
// line. Shared by the story player and the lesson entry screen, which starts downloading the
// opening lines' voices as soon as a lesson opens.

export function parseStoryScenes(rawItems = [], startIndex = 0) {
  let idx = startIndex;
  const sequenceItems = [];

  const isStopType = (t) => [
    'blackboard', 'blackboard-step', 'board',
    'multiple-choice', 'fill-in-the-blank', 'rearrange',
    'descriptive', 'didyouknow', 'did_you_know', 'did-you-know',
    'concept', 'statement', 'engagement', 'engagement-audio', 'engagement-mcq', 'engagement-rearrange'
  ].includes(String(t || '').toLowerCase());

  while (idx < rawItems.length) {
    const it = rawItems[idx];
    const t = String(it.type || '').toLowerCase();
    
    // Stop if we hit a non-comic/story section (after startIndex)
    if (idx > startIndex && isStopType(t)) {
      break;
    }
    // Also stop if startIndex itself is a stop type (unless it's comic/story)
    if (idx === startIndex && !['comic', 'story'].includes(t)) {
      break;
    }

    sequenceItems.push({ item: it, index: idx });
    idx++;
  }

  const nextSectionIndex = idx;

  const pages = [];
  let currentPage = null;

  for (const { item, index: itemIdx } of sequenceItems) {
    const t = String(item.type || '').toLowerCase();
    const itemId = String(item.itemId || '');
    const txt = item.text || item.question || '';
    const isImageInstruction = txt.toUpperCase().startsWith('INSERT IMAGE:');
    const isPanelOrScene = t === 'comic' || itemId.match(/\.P\d+$/i) || (itemId.match(/\.S\d+$/i) && !itemId.match(/\.D\d+/i));

    if (isPanelOrScene || !currentPage) {
      if (currentPage && (currentPage.elements.length > 0 || currentPage.sceneImage)) {
        pages.push(currentPage);
      }
      
      let title = item.cardTitle || (isImageInstruction ? txt.replace(/^INSERT IMAGE:\s*/i, '') : txt) || `Scene ${pages.length + 1}`;
      let image = null;
      if (item.images && item.images.length > 0) {
        image = item.images[0];
      } else if (item.imageUrl) {
        image = item.imageUrl;
      }

      currentPage = {
        partTitle: title,
        caption: "MISSION COMIC",
        sceneImage: image,
        elements: []
      };

      // If this comic item actually has spoken text or dialogue
      if (!isImageInstruction && (item.speaker || (txt && t === 'story'))) {
        currentPage.elements.push({
          id: item._id || itemIdx,
          type: 'dialogue',
          speaker: item.speaker || 'Hoshi',
          text: txt
        });
      }
    } else {
      // It's a dialogue / story item inside current scene
      const cleanText = isImageInstruction ? '' : txt;
      if (cleanText) {
        currentPage.elements.push({
          id: item._id || itemIdx,
          type: 'dialogue',
          speaker: item.speaker || 'Hoshi',
          text: cleanText
        });
      }
      if (!currentPage.sceneImage) {
        if (item.images && item.images.length > 0) currentPage.sceneImage = item.images[0];
        else if (item.imageUrl) currentPage.sceneImage = item.imageUrl;
      }
    }
  }

  if (currentPage && (currentPage.elements.length > 0 || currentPage.sceneImage)) {
    pages.push(currentPage);
  }

  return { pages, nextSectionIndex };
}

// Lines the story player skips (kept here so the entry screen preloads the same first lines)
export const isSkippedStoryLine = (item) => {
  const txt = (item?.text || '').toLowerCase();
  return txt.includes('detective squad took notes') || txt.includes('squad understood how digestion');
};

// Scalable on-the-fly streaming audio URL (zero static files, infinite comics support)
export const storyLineTtsUrl = (element) => {
  if (element.audioUrl) return element.audioUrl;
  const cleanText = (element.text || '').replace(/["*]/g, '').trim();
  const speaker = element.speaker || 'Arpit Sir';
  return `${getApiBase()}/api/ai/tts?text=${encodeURIComponent(cleanText)}&speaker=${encodeURIComponent(speaker)}&v=15`;
};

/** Voice URLs of the first `count` spoken lines of a story starting at `startIndex` */
export const storyOpeningTtsUrls = (items, startIndex = 0, count = 3) => {
  const { pages } = parseStoryScenes(items, startIndex);
  const first = pages[0]?.elements || [];
  return first.filter(el => el?.text && !isSkippedStoryLine(el)).slice(0, count).map(storyLineTtsUrl);
};
