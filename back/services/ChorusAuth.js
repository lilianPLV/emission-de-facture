import dotenv from "dotenv";
dotenv.config();

let cachedToken = null;
let tokenExpiry = 0;

export async function getOAuthToken() {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }
    const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.CHORUS_CLIENT_ID,
        client_secret: process.env.CHORUS_CLIENT_SECRET,
        scope: "openid",
    });
    const res = await fetch(`${process.env.CHORUS_OAUTH_URL}/api/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    if (!res.ok) throw new Error(`OAuth échoué : ${res.status}`)

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
}

export function getCproAccount() {
    const credentials = `${process.env.CHORUS_TECH_LOGIN}:${process.env.CHORUS_TECH_PASSWORD}`;
    return Buffer.from(credentials).toString("base64")
}

export async function apiPost(endpoint, body) {
    const token = await getOAuthToken();
    const res = await fetch(`${process.env.CHORUS_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "cpro-account": getCproAccount(),
            "Content-Type": "application/json;charset=utf-8",
            "Accept": "application/json;charset=utf-8",
        },
        body: JSON.stringify(body),
    });

    console.log(`🔍 HTTP ${res.status} ${res.statusText} — ${endpoint}`);
    console.log(`🔍 Headers réponse :`, {
        "content-type": res.headers.get("content-type"),
        "x-correlation-id": res.headers.get("x-correlationid"),
        "x-request-id": res.headers.get("x-request-id"),
        "x-rate-limit": res.headers.get("x-rate-limit"),
    });

    const text = await res.text();
    console.log(`🔍 Réponse brute :`, text);

    try {
        return JSON.parse(text);
    } catch {
        return { codeRetour: res.status, libelle: text };
    }
}

console.log("Bearer token reçus");