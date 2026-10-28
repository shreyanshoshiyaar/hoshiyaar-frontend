/**
 * Utility to identify MissionComplete / Case Closed items in lessons.
 */
export const isMissionCompleteItem = (item) => {
  if (!item) return false;
  const rawType = String(item.type || '').toLowerCase().trim();
  const itemId = String(item.itemId || '').trim();
  const text = String(item.text || item.question || '').trim().toLowerCase();

  return (
    rawType === 'missioncomplete' ||
    rawType === 'caseclosed' ||
    itemId.includes('MC') ||
    text.startsWith('case closed')
  );
};

/**
 * Parses "Case closed! ✓ [summary]. Next case: [nextCase]"
 */
export const parseCaseClosedText = (rawText) => {
  if (!rawText) return { summary: '', nextCase: '' };

  // Clean off "Case closed! ✓ " or variations
  let clean = String(rawText)
    .replace(/^case\s+closed[!.]*\s*[✓✔\s-]*/i, '')
    .trim();

  // Look for "Next case: ..."
  const nextCaseMatch = clean.match(/(?:^|\.\s*|\n)next\s+case:\s*(.+)$/i);
  if (nextCaseMatch) {
    const summary = clean.substring(0, clean.indexOf(nextCaseMatch[0])).trim();
    const nextCase = nextCaseMatch[1].trim();
    return {
      summary: summary || clean,
      nextCase
    };
  }

  return { summary: clean, nextCase: '' };
};
