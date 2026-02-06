import { useState, useEffect } from "react";
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create preview when user selects image
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleUpload = (e) => {
    setResult(null);
    setError("");
    setFile(e.target.files[0]);
  };

  const denoiseImage = async () => {
    if (!file) return alert("Please select an image first.");

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://image-clean.onrender.com/denoise", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Server error");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch (err) {
      setError("Something went wrong while denoising.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;
    
    const link = document.createElement("a");
    link.href = result;
    link.download = `denoised_${file.name || "image.png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <div className="header">
          <h1 className="title">✨ DnCNN Image Denoiser</h1>
          <p className="subtitle">
            Remove noise from your images with AI-powered denoising
          </p>
        </div>

        <div className="main-content">
          <label className={`upload-area ${preview ? 'has-preview' : ''}`}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleUpload}
              className="file-input"
            />
            <div className="upload-content">
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#94a3b8" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="upload-icon"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div className="upload-text">
                <p className="file-name">
                  {file ? file.name : "Click to upload image"}
                </p>
                <p className="file-info">PNG, JPG, JPEG up to 10MB</p>
              </div>
            </div>
          </label>

          {preview && (
            <div className={`images-grid ${result ? 'has-result' : ''}`}>
              <div className="image-card">
                <h3 className="card-title">📷 Original Image</h3>
                <img src={preview} alt="preview" className="preview-image" />
              </div>

              {result && (
                <div className="image-card">
                  <h3 className="card-title">✨ Denoised Result</h3>
                  <img src={result} alt="denoised" className="preview-image" />
                </div>
              )}
            </div>
          )}

          <div className="button-container">
            <button 
              onClick={denoiseImage} 
              disabled={loading || !file}
              className={`btn btn-primary ${(loading || !file) ? 'disabled' : ''}`}
            >
              {loading ? "Processing..." : "✨ Denoise Image"}
            </button>

            {result && (
              <button 
                onClick={downloadImage}
                className="btn btn-secondary"
              >
                📥 Download Image
              </button>
            )}
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;