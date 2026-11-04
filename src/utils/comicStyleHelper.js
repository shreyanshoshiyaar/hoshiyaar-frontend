/**
 * comicStyleHelper.js
 *
 * Distinguishes between:
 * 1. Older chapters: Classic comic slide view (ConceptPage.jsx with Zoom Image button & timer,
 *    as shown in user spec).
 * 2. New chapters: "Our style" StoryMode.jsx player with character dialogues, avatars & sound.
 */

export function isNewStyleStory({ item, items = [], chapterId = '', chapterTitle = '' } = {}) {
  const chIdStr = String(chapterId || '').trim();
  const chTitleStr = String(chapterTitle || '').toLowerCase();

  // 1. Explicit check for Chapter 9, Chapter 11, or any chapter marked v12
  if (
    chIdStr === '6ad8be61e323d9a75e28c0d5' ||
    chIdStr === '6ab0db4316293cf7bf7f88bb' ||
    chTitleStr.includes('light') ||
    chTitleStr.includes('life processes') ||
    chTitleStr.includes('v12') ||
    chTitleStr.includes('life processes in animals (v12 test)')
  ) {
    return true;
  }

  // 2. If the single item itself has a character speaker or is explicitly type 'story'
  if (item?.type === 'story' || (item?.speaker && String(item.speaker).trim().length > 0)) {
    return true;
  }

  // 3. If single item has v12 screenplay notation (e.g. itemId 'C1.P0' or starts with 'INSERT IMAGE:')
  if (typeof item?.itemId === 'string' && /^C\d+\./i.test(item.itemId)) {
    return true;
  }
  if (typeof item?.text === 'string' && item.text.toUpperCase().startsWith('INSERT IMAGE:')) {
    return true;
  }

  // 4. If any item in the module items array contains dialogue/speaker or v12 screenplay tags
  if (Array.isArray(items) && items.length > 0) {
    const hasStoryOrSpeaker = items.some(
      (it) => it?.type === 'story' || (it?.speaker && String(it.speaker).trim().length > 0)
    );
    if (hasStoryOrSpeaker) return true;

    const hasV12ItemIds = items.some(
      (it) => typeof it?.itemId === 'string' && /^C\d+\./i.test(it.itemId)
    );
    if (hasV12ItemIds) return true;

    const hasInsertImageInstruction = items.some(
      (it) => typeof it?.text === 'string' && it.text.toUpperCase().startsWith('INSERT IMAGE:')
    );
    if (hasInsertImageInstruction) return true;
  }

  // Otherwise, it's an older chapter comic slide -> Keep classic comic style!
  return false;
}

/**
 * Returns the proper target path for a comic or story item
 */
export function getComicOrStoryPath(moduleNumber, idx, { item, items = [], chapterId = '', chapterTitle = '', searchSuffix = '' } = {}) {
  const isNew = isNewStyleStory({ item, items, chapterId, chapterTitle });
  if (isNew) {
    return `/learn/module/${moduleNumber}/story/${idx}${searchSuffix}`;
  }
  return `/learn/module/${moduleNumber}/concept/${idx}${searchSuffix}`;
}
