export function getLearningParams({
  user,
  module,
  lesson,
  source = "website"
}) {
  return {
    "class": user?.classLevel || user?.class || "unknown_class",
    subject: module?.subject || lesson?.subject || "unknown_subject",
    chapter: module?.chapter || lesson?.chapter || "unknown_chapter",
    unit: module?.unit || lesson?.unit || "unknown_unit",
    module_name: module?.moduleName || module?.name || lesson?.moduleName || "unknown_module",
    level_name: module?.levelName || lesson?.levelName || module?.id || "unknown_level",
    source
  };
}
