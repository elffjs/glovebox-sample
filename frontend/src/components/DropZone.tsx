import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onFile: (file: File) => void;
  disabled: boolean;
}

export default function DropZone({ onFile, disabled }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        onFile(accepted[0]);
      }
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone ${isDragActive ? "drag-active" : ""} ${disabled ? "disabled" : ""}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop it here...</p>
      ) : (
        <p>Drag & drop a vehicle document here, or click to browse</p>
      )}
      <span className="hint">
        Supports JPEG, PNG, HEIC, WebP, and PDF
      </span>
    </div>
  );
}
