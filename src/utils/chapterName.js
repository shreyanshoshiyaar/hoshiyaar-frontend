// What students see as a chapter's name: the topic only ("Methods of Separation in Everyday Life"), without the
// "Chapter 9:" numbering, so the app reads as general science rather than one board's syllabus. The stored title
// keeps its number (ordering, matching and uploads rely on it), so use this only where a title is shown.
export const chapterName = (title = '') => {
  const raw = String(title ?? '');
  const stripped = raw.replace(/^\s*(chapter|ch\.?)\s*\d+\s*[:.\-–—]?\s*/i, '').trim();
  return stripped || raw;
};

export default chapterName;
