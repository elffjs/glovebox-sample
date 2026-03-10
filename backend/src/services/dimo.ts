import { DIMO } from "@dimo-network/data-sdk";
import { jwtDecode } from "jwt-decode";

const dimo = new DIMO("Production");

let developerJwt: string | null = null;

// Buffer in seconds — refresh when token is within 60s of expiry
const EXPIRY_BUFFER_S = 60;

function isTokenExpired(): boolean {
  if (!developerJwt) return true;

  const decoded = jwtDecode<{ exp: number }>(developerJwt);
  if (!decoded.exp) return true;

  return decoded.exp - EXPIRY_BUFFER_S <= Date.now() / 1000;
}

export async function authenticate(): Promise<void> {
  const clientId = process.env.DIMO_CLIENT_ID;
  const domain = process.env.DIMO_REDIRECT_URI;
  const privateKey = process.env.DIMO_API_KEY;

  if (!clientId || !domain || !privateKey) {
    throw new Error(
      "Missing DIMO credentials. Set DIMO_CLIENT_ID, DIMO_REDIRECT_URI, and DIMO_API_KEY in .env"
    );
  }

  const result = await dimo.auth.getDeveloperJwt({
    client_id: clientId,
    domain,
    private_key: privateKey,
  });

  developerJwt = result.headers.Authorization.replace("Bearer ", "");
  console.log("DIMO: authenticated as developer");
}

/** Returns a valid developer JWT string, refreshing automatically if expired. */
export async function getDeveloperJwt(): Promise<string> {
  if (isTokenExpired()) {
    await authenticate();
  }
  return developerJwt!;
}

export { dimo };
