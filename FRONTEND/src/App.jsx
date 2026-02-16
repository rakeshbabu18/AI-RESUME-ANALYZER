import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jd);

    const res = await axios.post(
      "http://localhost:5000/api/analyze",
      formData
    );

    setResult(res.data);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>🔥 AI Resume Analyzer</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <textarea
        placeholder="Paste Job Description"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows="6"
        style={{ display: "block", marginTop: 20 }}
      />

      <button onClick={handleSubmit} style={{ marginTop: 20 }}>
        Analyze
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>Match Score: {result.score}%</h2>

          <h3>Matched Skills</h3>
          <ul>
            {result.matchedSkills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h3>Missing Skills</h3>
          <ul>
            {result.missingSkills.map((s, i) => (
              <li key={i} style={{ color: "red" }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
