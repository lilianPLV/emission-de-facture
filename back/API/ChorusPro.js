import dotenv from "dotenv";
dotenv.config();

let cachedToken = null;
let tokenExpiry = 0;
async function getOAuthToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.CHORUS_CLIENT_ID,
    client_secret: process.env.CHORUS_CLIENT_SECRET,
    scope: "openid resource.READ",
  });

  const res = await fetch(`${process.env.CHORUS_OAUTH_URL}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) throw new Error(`OAuth échoué : ${res.status}`);

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

function getCproAccount(){
  const credentials = `${process.env.CHORUS_TECH_LOGIN}:${process.env.CHORUS_TECH_PASSWORD}`;
  return Buffer.from(credentials).toString("base64");
}

export async function uploadFichier(pdfBase64, nomFichier) {
  const token = await getOAuthToken();

  const res = await fetch(
    `${process.env.CHORUS_API_URL}/transverses/v1/ajouter/fichier`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "cpro-account": getCproAccount(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pieceJointeExtension: "pdf",
        pieceJointeFichier: pdfBase64,
        pieceJointeNom: nomFichier,
        pieceJointeTypeMime: "application/pdf",
      }),
    },
  );

  const data = await res.json();
  if (data.codeRetour !== 0) throw new Error(`Upload échoué : ${data.libelle}`);
  return data.pieceJointeId;
}

export async function soumettreFacture(pieceJointeId, nomFichier) {
  const token = await getOAuthToken();

  const res = await fetch(
    `${process.env.CHORUS_API_URL}/factures/v1/deposer/pdf`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "cpro-account": getCproAccount(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fichierFacture: String(pieceJointeId),
        formatDepot: "PDF_NON_SIGNE",
        nomFichier: nomFichier,
      }),
    },
  );

  const data = await res.json();
  if (data.codeRetour !== 0)
    throw new Error(`Soumission échouée : ${data.libelle}`);
  return data;
}
