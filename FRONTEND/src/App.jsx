import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/health")
      .then(res => res.json())
      .then(data => { if (mounted) setHealth(data); })
      .catch(() => { if (mounted) setHealth(null); });
    return () => { mounted = false; };
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      const type = f.type;
      const name = f.name.toLowerCase();
      if ((type === "application/pdf" || name.endsWith(".pdf")) || 
          (type === "text/plain" || name.endsWith(".txt"))) {
        setFile(f);
        setFileName(f.name);
        setError("");
      } else {
        setError("Please upload a PDF or TXT file only.");
        setFile(null);
      }
    }
  };

  const handleFileWrapperClick = () => {
    const input = document.getElementById("resume-input");
    if (input) input.click();
  };

  const handleAnalyze = async () => {
    setError("");
    if (!file) {
      setError("Please select a resume (PDF or TXT).");
      return;
    }
    if (!jd.trim()) {
      setError("Please enter the job description.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jd);

      console.log("Sending request to /api/analyze...");
      const res = await axios.post("/api/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      console.log("Response received:", res.data);
      
      if (!res.data || typeof res.data !== 'object') {
        throw new Error("Invalid response format from server");
      }

      if (res.data.score === undefined || !res.data.matchedSkills || !res.data.missingSkills) {
        console.error("Missing required fields in response:", res.data);
        throw new Error("Incomplete response from server. Please check backend logs.");
      }

      setResult(res.data);
      setFile(null);
      setFileName("");
      console.log("Results set successfully");
    } catch (err) {
      console.error("Full error object:", err);
      console.error("Error response:", err.response?.data);
      const errorMsg = err.response?.data?.error || err.message || "Analysis failed. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setJd("");
    setError("");
  };

  const copyMissing = async () => {
    const missing = result?.missingSkills || [];
    if (missing.length === 0) return;
    try {
      await navigator.clipboard.writeText(missing.join(", "));
      alert("Missing skills copied!");
    } catch {
      alert("Failed to copy");
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="title">🔥 AI Resume Analyzer</h1>
          <p className="subtitle">Analyze your resume against any job description</p>
          <div className={`status ${health ? "status-ok" : "status-unavailable"}`}>
            Backend: {health ? "Connected" : "Unavailable"}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!result ? (
          <div className="form-section">
            <div className="form-card">
              <div className="form-group">
                <label htmlFor="resume-input" className="form-label">
                  📄 Upload Your Resume
                </label>
                <div className="file-input-wrapper" onClick={handleFileWrapperClick}>
                  <input
                    id="resume-input"
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <div className="file-display">
                    {fileName ? (
                      <span className="file-name">✓ {fileName}</span>
                    ) : (
                      <span className="file-placeholder">Choose PDF or TXT file</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="jd-input" className="form-label">
                  💼 Job Description
                </label>
                <textarea
                  id="jd-input"
                  placeholder="Paste or type the job description here..."
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  className="textarea"
                  rows="8"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="submit-button"
              >
                {loading ? "Analyzing..." : "Analyze Resume"}
              </button>
            </div>
          </div>
        ) : result ? (
          <div className="results-section">
            <div className="results-card">
              {/* Score Section */}
              <div className="score-section">
                <div className="score-circle" style={{
                  background: result.score >= 70 ? "#4ade80" : result.score >= 40 ? "#facc15" : "#ef4444"
                }}>
                  <div className="score-value">{result.score ?? 0}%</div>
                </div>
                <div className="score-text">
                  <h2>Match Score</h2>
                  <p className="score-label">
                    {result.score >= 70
                      ? "✨ Excellent fit!"
                      : result.score >= 50
                      ? "👍 Good match"
                      : result.score > 0
                      ? "📈 Needs improvement"
                      : "❌ No matching skills found"}
                  </p>
                </div>
              </div>

              {/* Matched Skills */}
              <div className="skills-section">
                <h3 className="skills-title">✅ Matched Skills ({result.matchedSkills?.length || 0})</h3>
                {(result.matchedSkills || []).length > 0 ? (
                  <div className="skills-list matched">
                    {result.matchedSkills.map((skill, i) => (
                      <span key={i} className="skill-badge matched-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No matched skills found</p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="skills-section">
                <h3 className="skills-title">❌ Missing Skills ({result.missingSkills?.length || 0})</h3>
                {(result.missingSkills || []).length > 0 ? (
                  <>
                    <div className="skills-list missing">
                      {result.missingSkills.map((skill, i) => (
                        <span key={i} className="skill-badge missing-badge">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button onClick={copyMissing} className="copy-button">
                      📋 Copy Missing Skills
                    </button>
                  </>
                ) : (
                  <p className="empty-message">🎉 You have all required skills!</p>
                )}
              </div>

              {/* Suggestions */}
              {(result.missingSkills || []).length > 0 && (
                <div className="suggestions-section">
                  <h3 className="suggestions-title">💡 Learning Suggestions</h3>
                  <ul className="suggestions-list">
                    {result.missingSkills.map((skill, i) => (
                      <li key={i}>
                        <strong>{skill}</strong> —{" "}
                        Consider learning this skill by taking online courses, building projects, or contributing to open source.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-buttons">
                <button onClick={resetForm} className="reset-button">
                  ↻ Analyze Another Resume
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#red" }}>Error: Failed to load results. Please try again.</p>
            <button onClick={resetForm} className="reset-button">
              ↻ Start Over
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>AI Resume Analyzer © 2026 — Powered by Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;
