import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8001";

function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingTime, setProcessingTime] = useState(null);

  async function handleTranscribe() {
    if (!file) {
      setError("Please select an audio file first.");
      return;
    }

    setLoading(true);
    setError("");
    setTranscript("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(`${API_URL}/transcribe`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Transcription failed.");
      }

      setTranscript(data.text);
      setProcessingTime(data.processing_time_seconds * 1000);
    } catch (error) {
      setError(error.message || "Unable to connect to Python server.");
    } finally {
      setLoading(false);
    }
  }

  function copyTranscript() {
    navigator.clipboard.writeText(transcript);
  }

  function downloadTranscript() {
    const blob = new Blob([transcript], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "arabic-transcript.txt";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="app">
      <header className="header">
        <span className="eyebrow">AI SPEECH RECOGNITION</span>
        <h1>Arabic Transcription Studio</h1>
        <p>
          Upload Arabic audio and convert speech into text using
          Hugging Face Inference Providers.
        </p>
      </header>

      <section className="card">
        <h2>Upload audio</h2>

        <label className="upload-box">
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.flac,.ogg"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setError("");
              setTranscript("");
              setProcessingTime(null);
            }}
          />

          <span className="upload-icon">🎙️</span>

          <strong>
            {file ? file.name : "Choose an audio file"}
          </strong>

          <span className="muted">
            WAV, MP3, M4A, FLAC or OGG
          </span>
        </label>

        <button
          className="primary-button"
          onClick={handleTranscribe}
          disabled={!file || loading}
        >
          {loading ? "Transcribing..." : "Transcribe Arabic Audio"}
        </button>

        {loading && (
          <p className="status">
            Processing audio. This may take a little while.
          </p>
        )}

        {error && <p className="error">{error}</p>}
      </section>

      {transcript && (
        <section className="card result-card">
          <div className="result-heading">
            <div>
              <h2>Transcript</h2>
              <p className="muted">
                Model: openai/whisper-large-v3-turbo
              </p>
            </div>

            {processingTime !== null && (
              <span className="time">
                {(processingTime / 1000).toFixed(2)} s
              </span>
            )}
          </div>

          <div className="transcript" dir="rtl" lang="ar">
            {transcript}
          </div>

          <div className="actions">
            <button className="secondary-button" onClick={copyTranscript}>
              Copy text
            </button>

            <button
              className="secondary-button"
              onClick={downloadTranscript}
            >
              Download TXT
            </button>
          </div>
        </section>
      )}

      <footer>
        Powered by React, Express and Hugging Face
      </footer>
    </main>
  );
}

export default App;