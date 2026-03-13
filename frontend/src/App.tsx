import { useRef, useState } from "react";
import DropZone from "./components/DropZone";
import ResultDisplay from "./components/ResultDisplay";
import AttestationBrowser from "./components/AttestationBrowser";

interface ParsedResult {
  documentType: string;
  confidence: number;
  fields: Record<string, string | number | null>;
  rawText: string;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [tokenId, setTokenId] = useState("");
  const [view, setView] = useState<"upload" | "attestations">("upload");
  const prevUrlRef = useRef<string | null>(null);

  async function handleUpload(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    setIsPdf(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));

    // Revoke previous object URL to prevent memory leaks
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    prevUrlRef.current = url;

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (tokenId.trim()) {
        formData.append("tokenId", tokenId.trim());
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Upload failed (${res.status})`);
      }

      const data: ParsedResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>Glovebox</h1>
      <p className="subtitle">
        Drop a vehicle document to extract structured data
      </p>

      <div className="token-id-input">
        <label htmlFor="tokenId">Vehicle Token ID</label>
        <input
          id="tokenId"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="e.g. 22892"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          disabled={loading}
        />
        <button
          className="browse-btn"
          disabled={!tokenId.trim() || loading}
          onClick={() => setView("attestations")}
        >
          Browse Attestations
        </button>
      </div>

      {view === "attestations" ? (
        <AttestationBrowser
          tokenId={tokenId.trim()}
          onBack={() => setView("upload")}
        />
      ) : (
      <>
      <DropZone onFile={handleUpload} disabled={loading} />

      {loading && previewUrl && (
        <div className="preview-section">
          {isPdf ? (
            <div className="preview-pdf-badge">PDF Document</div>
          ) : (
            <img src={previewUrl} alt={fileName ?? "Uploaded document"} className="preview-image" />
          )}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <span>Analyzing {fileName}...</span>
        </div>
      )}

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && <ResultDisplay result={result} fileName={fileName} previewUrl={previewUrl} isPdf={isPdf} />}
      </>
      )}
    </div>
  );
}
