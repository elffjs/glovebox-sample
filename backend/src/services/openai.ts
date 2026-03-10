import OpenAI from "openai";
import type { ParsedVehicleDocument } from "../types.js";

const client = new OpenAI();

const SYSTEM_PROMPT = `You are a vehicle document parser. You will receive an image of a vehicle-related document (registration, insurance card, service record, license plate photo, title, driver's license, inspection report, etc.).

Extract all visible information and return a JSON object with this exact schema:

{
  "documentType": "vehicle_registration" | "insurance_card" | "service_record" | "license_plate_photo" | "title" | "drivers_license" | "inspection_report" | "other",
  "confidence": <number between 0 and 1>,
  "fields": {
    "vin": <string or null>,
    "licensePlate": <string or null>,
    "state": <string or null>,
    "make": <string or null>,
    "model": <string or null>,
    "year": <number or null>,
    "color": <string or null>,
    "ownerName": <string or null>,
    "ownerAddress": <string or null>,
    "expirationDate": <string or null>,
    "issueDate": <string or null>,
    "insuranceProvider": <string or null>,
    "policyNumber": <string or null>,
    "registrationNumber": <string or null>,
    "odometerReading": <string or null>,
    "serviceDescription": <string or null>,
    "serviceDate": <string or null>
  },
  "rawText": <string with any other visible text not captured in fields>
}

Rules:
- Return ONLY the JSON object, no markdown fences or extra text
- Set fields to null if not visible in the document
- For VINs, be extremely careful with each character — they are 17 characters, mix of letters and digits
- For license plates, include the state if visible
- Confidence should reflect how clearly the document is readable
- rawText should capture any other relevant text not covered by the named fields`;

export async function parseDocumentImage(
  base64: string,
  mediaType: string
): Promise<ParsedVehicleDocument> {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mediaType};base64,${base64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Parse this vehicle document and extract all fields.",
          },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";

  // Strip markdown fences if present
  const cleaned = raw
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  const parsed: ParsedVehicleDocument = JSON.parse(cleaned);
  return parsed;
}
