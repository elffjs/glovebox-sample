import { useState } from "react";

interface Props {
  result: {
    documentType: string;
    confidence: number;
    fields: Record<string, string | number | null>;
    rawText: string;
  };
  fileName: string | null;
  previewUrl: string | null;
  isPdf: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  vin: "VIN",
  licensePlate: "License Plate",
  state: "State",
  make: "Make",
  model: "Model",
  year: "Year",
  color: "Color",
  ownerName: "Owner Name",
  ownerAddress: "Owner Address",
  expirationDate: "Expiration Date",
  issueDate: "Issue Date",
  insuranceProvider: "Insurance Provider",
  policyNumber: "Policy Number",
  registrationNumber: "Registration Number",
  odometerReading: "Odometer Reading",
  serviceDescription: "Service Description",
  serviceDate: "Service Date",
};

function formatDocType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ResultDisplay({ result, fileName, previewUrl, isPdf }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const nonNullFields = Object.entries(result.fields).filter(
    ([, value]) => value != null
  );

  return (
    <div className="result-card">
      {previewUrl && (
        <div className="preview-section">
          {isPdf ? (
            <div className="preview-pdf-badge">PDF Document</div>
          ) : (
            <img src={previewUrl} alt={fileName ?? "Uploaded document"} className="preview-image" />
          )}
        </div>
      )}

      <div className="result-header">
        <h2>{formatDocType(result.documentType)}</h2>
        <span className="confidence">
          {Math.round(result.confidence * 100)}% confidence
        </span>
      </div>

      {fileName && <p className="file-name">File: {fileName}</p>}

      {nonNullFields.length > 0 ? (
        <table className="fields-table">
          <tbody>
            {nonNullFields.map(([key, value]) => (
              <tr key={key}>
                <td className="field-label">{FIELD_LABELS[key] ?? key}</td>
                <td className="field-value">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-fields">No structured fields extracted.</p>
      )}

      <div className="collapsibles">
        {result.rawText && (
          <div>
            <button
              className="toggle-btn"
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "Hide" : "Show"} Raw Text
            </button>
            {showRaw && <pre className="raw-text">{result.rawText}</pre>}
          </div>
        )}

        <div>
          <button
            className="toggle-btn"
            onClick={() => setShowJson(!showJson)}
          >
            {showJson ? "Hide" : "Show"} Full JSON
          </button>
          {showJson && (
            <pre className="raw-text">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
