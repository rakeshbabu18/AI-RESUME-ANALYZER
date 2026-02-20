export function calculateMatch(resumeSkills, jdSkills) {

  const aliasMap = {
    js: 'javascript',
    nodejs: 'nodejs',
    'node.js': 'nodejs',
    ts: 'typescript',
    csharp: 'c#',
    'c#': 'c#',
    py: 'python',
    postgres: 'postgresql',
    sql: 'sql'
  };

  const normalizeSkill = (s) => {
    if (!s || typeof s !== 'string') return '';
    let t = s.trim().toLowerCase();
    // common replacements
    t = t.replace(/&/g, 'and');
    t = t.replace(/\s+/g, ' ');
    // map aliases
    if (aliasMap[t]) return aliasMap[t];
    // remove non-alphanumeric except + and # (keep c++ and c#)
    const keep = t.replace(/[^a-z0-9+#]/g, '');
    return keep;
  };

  const levenshtein = (a, b) => {
    if (!a) return b.length;
    if (!b) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const resumeNorm = (resumeSkills || []).map(s => ({ orig: s, norm: normalizeSkill(s) }));
  const jdNorm = (jdSkills || []).map(s => ({ orig: s, norm: normalizeSkill(s) }));

  const matched = [];
  const missing = [];

  for (const jd of jdNorm) {
    if (!jd.norm) {
      missing.push(jd.orig);
      continue;
    }

    // exact normalized match
    let found = resumeNorm.find(r => r.norm && r.norm === jd.norm);

    // substring match (e.g., "react" in "reactjs")
    if (!found) {
      found = resumeNorm.find(r => r.norm && (r.norm.includes(jd.norm) || jd.norm.includes(r.norm)));
    }

    // fuzzy match using Levenshtein distance for short tokens
    if (!found) {
      for (const r of resumeNorm) {
        if (!r.norm) continue;
        const dist = levenshtein(r.norm, jd.norm);
        const maxDist = Math.floor(Math.max(r.norm.length, jd.norm.length) * 0.25) + 1; // allow ~25% edits
        if (dist <= maxDist) {
          found = r;
          break;
        }
      }
    }

    if (found) matched.push(jd.orig);
    else missing.push(jd.orig);
  }

  const score = jdNorm.length === 0 ? 0 : Math.round((matched.length / jdNorm.length) * 100);

  return {
    score,
    matchedSkills: matched,
    missingSkills: missing
  };
}
