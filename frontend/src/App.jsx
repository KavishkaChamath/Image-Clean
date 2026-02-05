import { useState, useEffect } from "react";

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
      const res = await fetch("https://YOUR-RENDER-URL/denoise", {
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

  return (
    <div style={{ textAlign: "center", marginTop: "40px", fontFamily: "Arial" }}>
      <h1>DnCNN Image Denoiser</h1>

      <input type="file" accept="image/*" onChange={handleUpload} />

      {preview && (
        <div>
          <h3>Original Image:</h3>
          <img src={preview} alt="preview" style={{ maxWidth: "300px" }} />
        </div>
      )}

      <br />
      <button onClick={denoiseImage} disabled={loading}>
        {loading ? "Processing..." : "Denoise"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div>
          <h3>Denoised Result:</h3>
          <img src={result} alt="denoised" style={{ maxWidth: "300px" }} />
        </div>
      )}
    </div>
  );
}

export default App;
