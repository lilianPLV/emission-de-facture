import dotenv from "dotenv";
dotenv.config();

const params = new URLSearchParams({
  grant_type: "client_credentials",
  client_id: process.env.CHORUS_CLIENT_ID,
  client_secret: process.env.CHORUS_CLIENT_SECRET,
  scope: "openid resource.READ",
});

const tokenRes = await fetch(`${process.env.CHORUS_OAUTH_URL}/api/oauth/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: params.toString(),
});

const tokenData = await tokenRes.json();
console.log("Token obtenu :", tokenData.access_token ? "OK" : "ÉCHEC");

const credentials = `${process.env.CHORUS_TECH_LOGIN}:${process.env.CHORUS_TECH_PASSWORD}`;
const cproAccount = Buffer.from(credentials).toString("base64");

const res = await fetch(`${process.env.CHORUS_API_URL}/factures/v1/consulter/listeFournisseur`, {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "cpro-account": cproAccount,
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        parametresRecherche: {
            nbResultatsParPage: 10,
            pageResultatDemandee: 1,
            statut: "A TRAITER"
        },
    }),
});

const data = await res.json();
console.log("Réponse brute :", JSON.stringify(data, null, 2));