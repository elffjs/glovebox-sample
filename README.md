# Glovebox Sample

Drag-and-drop vehicle documents (registrations, insurance cards, service records, license plate photos, etc.) and get structured data extracted via GPT-4o vision.

No auth, no database — just upload, AI parse, display results.

## How it works

1. User drops a file in the browser
2. Frontend sends it to the Express backend via `POST /api/upload`
3. Backend converts the file to a GPT-4o-compatible image (resizes large images, converts HEIC to JPEG, renders PDF first page to PNG)
4. Backend sends the image to GPT-4o vision with `detail: "high"` and a structured extraction prompt
5. GPT-4o returns JSON with document type, confidence score, and extracted fields (VIN, plate, make, model, year, owner, insurance info, etc.)
6. Frontend displays the results in a table with collapsible raw text and full JSON

## Project structure

```
glovebox-sample/
├── package.json              # pnpm workspace root
├── pnpm-workspace.yaml
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server on :3001
│   │   ├── types.ts          # ParsedVehicleDocument interface
│   │   ├── routes/
│   │   │   └── upload.ts     # POST /api/upload (multer → convert → parse)
│   │   └── services/
│   │       ├── convert.ts    # HEIC→JPEG, PDF→PNG via mupdf, resize via sharp
│   │       └── openai.ts     # GPT-4o vision call with extraction prompt
└── frontend/
    ├── vite.config.ts        # proxies /api → localhost:3001
    ├── index.html
    └── src/
        ├── App.tsx           # Upload state, loading/error, result display
        ├── App.css
        └── components/
            ├── DropZone.tsx      # react-dropzone wrapper
            └── ResultDisplay.tsx # Renders extracted fields as table
```

## Setup

```bash
pnpm install
cp .env.example backend/.env
# Edit backend/.env and set OPENAI_API_KEY
pnpm dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

## Supported file types

- JPEG, PNG, WebP — sent directly (resized if over 2048px)
- HEIC/HEIF — converted to JPEG via sharp
- PDF — first page rendered to PNG via mupdf

## Extracted fields

VIN, license plate, state, make, model, year, color, owner name/address, expiration/issue dates, insurance provider, policy number, registration number, odometer reading, service description/date, plus a raw text catch-all.
