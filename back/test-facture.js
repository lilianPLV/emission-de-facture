import dotenv from "dotenv";
dotenv.config();
import fs from "fs";

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
const credentials = `${process.env.CHORUS_TECH_LOGIN}:${process.env.CHORUS_TECH_PASSWORD}`;
const cproAccount = Buffer.from(credentials).toString("base64");

const pdfBuffer = fs.readFileSync("test-facture.pdf");
const pdfBase64 = pdfBuffer.toString("base64");

const factureRes = await fetch(`${process.env.CHORUS_API_URL}/factures/v1/deposer/pdf`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${tokenData.access_token}`,
    "cpro-account": cproAccount,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
  fichierFacture: "10881615",
  formatDepot: "PDF_NON_SIGNE",
  nomFichier: "facture-test.pdf"
}),
});

const factureData = await factureRes.json();
console.log("Soumission facture :", JSON.stringify(factureData, null, 2));
