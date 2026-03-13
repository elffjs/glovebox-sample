import crypto from "node:crypto";
import { signMessage } from "viem/accounts";
import { getDeveloperJwt } from "./dimo.js";
import type { ParsedVehicleDocument } from "../types.js";

const ATTEST_URL =
  process.env.DIMO_ATTESTATION_URL ?? "https://attest.dimo.zone";

// Production: Polygon mainnet (137), Dev: Polygon Amoy (80002)
const DID_CHAIN_ID = process.env.DIMO_CHAIN_ID ?? "137";
const DID_NFT_ADDRESS =
  process.env.DIMO_NFT_ADDRESS ?? "0xbA5738a18d83D41847dfFbDC6101d37C69c9B0cF";

export function buildVehicleDid(tokenId: string): string {
  return `did:erc721:${DID_CHAIN_ID}:${DID_NFT_ADDRESS}:${tokenId}`;
}

async function signData(dataJson: string): Promise<`0x${string}`> {
  const privateKey = `0x${process.env.DIMO_API_KEY!}` as `0x${string}`;
  return signMessage({ message: dataJson, privateKey });
}

interface SignedCloudEvent {
  specversion: string;
  id: string;
  source: string;
  type: string;
  subject: string;
  time: string;
  datacontenttype: string;
  data: ParsedVehicleDocument;
  signature: string;
}

async function buildCloudEvent(
  doc: ParsedVehicleDocument,
  tokenId: string
): Promise<SignedCloudEvent> {
  const dataJson = JSON.stringify(doc);
  const signature = await signData(dataJson);

  return {
    specversion: "1.0",
    id: crypto.randomUUID(),
    source: process.env.DIMO_CLIENT_ID!,
    type: "dimo.attestation",
    subject: buildVehicleDid(tokenId),
    time: new Date().toISOString(),
    datacontenttype: "application/json",
    data: doc,
    signature,
  };
}

interface RawFileCloudEvent {
  specversion: string;
  id: string;
  source: string;
  type: string;
  subject: string;
  time: string;
  datacontenttype: string;
  data_base64: string;
  signature: string;
}

async function signBytes(data: Buffer): Promise<`0x${string}`> {
  const privateKey = `0x${process.env.DIMO_API_KEY!}` as `0x${string}`;
  return signMessage({ message: { raw: data }, privateKey });
}

async function buildRawFileCloudEvent(
  fileBuffer: Buffer,
  mimetype: string,
  tokenId: string
): Promise<RawFileCloudEvent> {
  const signature = await signBytes(fileBuffer);
  return {
    specversion: "1.0",
    id: crypto.randomUUID(),
    source: process.env.DIMO_CLIENT_ID!,
    type: "dimo.attestation",
    subject: buildVehicleDid(tokenId),
    time: new Date().toISOString(),
    datacontenttype: mimetype,
    data_base64: fileBuffer.toString("base64"),
    signature,
  };
}

export async function attestRawFile(
  fileBuffer: Buffer,
  mimetype: string,
  tokenId: string
): Promise<Response> {
  const jwt = await getDeveloperJwt();
  const event = await buildRawFileCloudEvent(fileBuffer, mimetype, tokenId);

  console.log("Attesting raw file:", mimetype, fileBuffer.length, "bytes");

  const res = await fetch(ATTEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/cloudevents+json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Raw file attestation failed (${res.status}): ${body}`);
  }

  return res;
}

export async function attestDocument(
  doc: ParsedVehicleDocument,
  tokenId: string
): Promise<Response> {
  const jwt = await getDeveloperJwt();
  const event = await buildCloudEvent(doc, tokenId);

  console.log("Attesting:", JSON.stringify(event, null, 2));

  const res = await fetch(ATTEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/cloudevents+json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Attestation failed (${res.status}): ${body}`);
  }

  return res;
}
