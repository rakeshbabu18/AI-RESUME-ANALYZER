export function calculateMatch(resumeSkills, jdSkills) {

  const normalize = arr =>
    arr.map(skill => skill.toLowerCase());

  const resume = normalize(resumeSkills);
  const jd = normalize(jdSkills);

  const matched = jd.filter(skill => resume.includes(skill));
  const missing = jd.filter(skill => !resume.includes(skill));

  const score = jd.length === 0
    ? 0
    : Math.round((matched.length / jd.length) * 100);

  return {
    score,
    matchedSkills: matched,
    missingSkills: missing
  };
}
