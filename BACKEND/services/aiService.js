import axios from "axios";

async function callGemini(prompt, maxRetries = 2) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        },
        { timeout: 10000 }
      );

      const output = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!output) throw new Error("Empty response from Gemini");

      return output;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      // Retry delay
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

function extractJsonArray(text) {
  // Clean JSON code blocks
  let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  
  // Try to find JSON array
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn("No JSON array found in response");
    return null;
  }

  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) {
      console.warn("Parsed value is not an array:", arr);
      return null;
    }
    
    // Filter and normalize: keep only strings, dedupe, trim
    const skills = [...new Set(
      arr
        .map(item => {
          const str = (typeof item === 'string' ? item : String(item)).trim();
          return str;
        })
        .filter(s => s.length > 0 && s.length < 50)
    )];
    
    console.log("Successfully parsed JSON array with skills:", skills);
    return skills;
  } catch (e) {
    console.warn("Failed to parse JSON:", e.message, "Text:", match[0].substring(0, 100));
    return null;
  }
}

export async function extractSkills(text) {
  if (!text || typeof text !== 'string') {
    console.warn("Invalid input to extractSkills");
    return [];
  }

  try {
    // Try Gemini first if configured
    const prompt = `
You are a professional skill extraction assistant.
Extract ONLY technical and professional skills from the text below.
Return a valid JSON array with skill names (strings).
Do NOT include generic words like "communication" or "teamwork".
Focus on tools, languages, frameworks, platforms, and databases.

Example output:
["Node.js", "Express", "MongoDB", "Docker", "AWS"]

Text to analyze:
${text.substring(0, 3000)}

Return ONLY the JSON array, no explanation.
`;

    console.log("Attempting Gemini extraction...");
    const output = await callGemini(prompt);
    console.log("Gemini raw response:", output.substring(0, 200));
    
    const skills = extractJsonArray(output);
    
    if (skills && skills.length > 0) {
      console.log("✓ Gemini extraction succeeded with", skills.length, "skills:", skills);
      return skills;
    }

    console.warn("Gemini returned empty or unparseable response, using fallback");
    return fallbackExtraction(text);
  } catch (error) {
    console.warn("⚠ Gemini API error:", error.message);
    console.log("Using fallback extraction instead...");
    // Fallback to keyword extraction
    return fallbackExtraction(text);
  }
}

function fallbackExtraction(text) {
  const commonTech = [
    // Languages
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Kotlin", "Swift",
    // Backend/Frameworks
    "Node.js", "Express", "Django", "Flask", "Spring", "FastAPI", "Rails", "Laravel", "ASP.NET", ".NET",
    // Frontend
    "React", "Vue.js", "Angular", "Svelte", "HTML", "CSS", "SASS", "Tailwind CSS", "Bootstrap",
    // Databases
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "DynamoDB", "CosmosDB", "Oracle", "SQLite", "NoSQL",
    // Cloud & DevOps
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI",
    // APIs & Auth
    "REST", "REST API", "GraphQL", "JWT", "OAuth", "OpenAPI",
    // Tools & Concepts
    "Git", "Linux", "Windows", "macOS", "Terraform", "Ansible", "Microservices", "Agile", "Scrum",
    // ML/Data
    "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn", "Jupyter", "Spark", "Hadoop"
  ];

  const found = new Set();
  const lower = (text || "").toLowerCase();
  
  // Match known tech (case-insensitive)
  for (const tech of commonTech) {
    const techLower = tech.toLowerCase();
    // Check for exact word boundaries or common separators
    if (lower.includes(techLower)) {
      found.add(tech);
    }
  }

  // Fallback: if few or no skills found, extract potential tech tokens
  if (found.size < 3) {
    const tokens = (text || "").match(/\b[A-Za-z0-9+#.\-]+\b/g) || [];
    const stopWords = new Set([
      "the", "and", "for", "with", "that", "this", "from", "have", "will", "your", "are", "but",
      "can", "has", "not", "been", "more", "also", "may", "one", "two", "all", "by", "or", "is", "be",
      "as", "in", "to", "of", "years", "experience", "skills", "required", "good", "strong", "knowledge",
      "familiarity", "plus", "communication", "looking", "we", "developer", "backend", "frontend"
    ]);
    
    for (const token of tokens) {
      const t = token.trim();
      const low = t.toLowerCase();
      
      // Filter: length, not a stop word, has letters
      if (t.length > 1 && t.length <= 30 && !stopWords.has(low) && /[A-Za-z]/.test(t)) {
        // Looks like tech: has special char, uppercase, or is a number version
        if (/[\.\+#\-]/.test(t) || /[A-Z]/.test(t) || /^v?\d+/.test(t)) {
          found.add(t);
        }
      }
      
      if (found.size >= 50) break;
    }
  }

  console.log("Fallback extraction found:", Array.from(found));
  return Array.from(found);
}
