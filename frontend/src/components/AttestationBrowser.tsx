import { useEffect, useState } from "react";

interface Attestation {
  time?: string;
  source?: string;
  id?: string;
  datacontenttype?: string;
  dataversion?: string;
  producer?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface Props {
  tokenId: string;
  onBack: () => void;
}

export default function AttestationBrowser({ tokenId, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attestations, setAttestations] = useState<Attestation[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetch_() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/attestations?tokenId=${encodeURIComponent(tokenId)}&limit=20`
        );

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }

        const data = await res.json();
        if (!cancelled) {
          setAttestations(Array.isArray(data) ? data : data.indexes ?? data.keys ?? []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch_();
    return () => { cancelled = true; };
  }, [tokenId]);

  return (
    <div className="attestation-browser">
      <button className="back-btn" onClick={onBack}>
        &larr; Back
      </button>

      <h2>Attestations for Token {tokenId}</h2>

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <span>Loading attestations...</span>
        </div>
      )}

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && attestations.length === 0 && (
        <div className="empty-state">
          No attestations found for this vehicle.
        </div>
      )}

      {!loading && attestations.length > 0 && (
        <div className="attestation-list">
          {attestations.map((att, i) => (
            <div key={att.id ?? i} className="attestation-card">
              {att.time && (
                <div className="att-field">
                  <span className="att-label">Time</span>
                  <span className="att-value">{att.time}</span>
                </div>
              )}
              {att.source && (
                <div className="att-field">
                  <span className="att-label">Source</span>
                  <span className="att-value">{att.source}</span>
                </div>
              )}
              {att.id && (
                <div className="att-field">
                  <span className="att-label">ID</span>
                  <span className="att-value">{att.id}</span>
                </div>
              )}
              {att.datacontenttype && (
                <div className="att-field">
                  <span className="att-label">Content Type</span>
                  <span className="att-value">{att.datacontenttype}</span>
                </div>
              )}
              {att.dataversion && (
                <div className="att-field">
                  <span className="att-label">Data Version</span>
                  <span className="att-value">{att.dataversion}</span>
                </div>
              )}
              {att.producer && (
                <div className="att-field">
                  <span className="att-label">Producer</span>
                  <span className="att-value">{att.producer}</span>
                </div>
              )}
              {att.tags && att.tags.length > 0 && (
                <div className="att-field">
                  <span className="att-label">Tags</span>
                  <span className="att-value">{att.tags.join(", ")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
