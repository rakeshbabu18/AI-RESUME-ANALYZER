import axios from "axios";

export async function extractSkills(text) {
  try {
    const prompt = `
Extract only technical skills from the following text.
Return ONLY a valid JSON array.
Do not add explanation.
Example:
["Node.js", "React", "MongoDB"]

Text:
${text}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    let output = response.data.candidates[0].content.parts[0].text;

    
    output = output.replace(/```json|```/g, "").trim();

    
    const match = output.match(/\[.*\]/s);
    if (!match) return [];

    return JSON.parse(match[0]);

  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return [];
  }
}
