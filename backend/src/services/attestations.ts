import { dimo, getDeveloperJwt } from "./dimo.js";
import { buildVehicleDid } from "./attest.js";

export async function getAttestations(tokenId: string, limit = 20) {
  const devJwt = await getDeveloperJwt();

  const vehicleJwt = await dimo.tokenexchange.getVehicleJwt({
    headers: { Authorization: `Bearer ${devJwt}` },
    tokenId: Number(tokenId),
  });

  const did = buildVehicleDid(tokenId);

  const result = await dimo.fetch.getIndexKeys({
    ...vehicleJwt,
    did,
    limit,
    filter: { type: "dimo.attestation" },
  });

  // SDK returns the full GraphQL response: { data: { indexes: [{ header: {...}, indexKey }] } }
  const indexes = result?.data?.indexes ?? [];
  return indexes.map((entry: { header: Record<string, unknown>; indexKey?: string }) => ({
    ...entry.header,
    indexKey: entry.indexKey,
  }));
}
