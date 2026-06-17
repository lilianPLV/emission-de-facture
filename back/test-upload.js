import dotenv from "dotenv";
dotenv.config();
import { getOAuthToken, getCproAccount } from "./services/chorusAuth.js";
import { readFileSync } from "fs";

const token = await getOAuthToken();
console.log("✅ Token OK");

// Lit le PDF de test à la racine du projet
const pdfBuffer = readFileSync("./facture-test.pdf");
const pdfBase64 = pdfBuffer.toString("base64");

const body = {
  pieceJointeFichier: pdfBase64,
  pieceJointeNom: "facture-test.pdf",
  pieceJointeTypeMime: "application/pdf",
  pieceJointeExtension: "pdf",
};

const res = await fetch(
  `${process.env.CHORUS_API_URL}/transverses/v1/ajouter/fichier`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "cpro-account": getCproAccount(),
      "Content-Type": "application/json;charset=utf-8",
      "Accept": "application/json;charset=utf-8",
    },
    body: JSON.stringify(body),
  }
);

console.log("📡 Status HTTP :", res.status, res.statusText);
const data = await res.json();
console.log("📦 Réponse :", JSON.stringify(data, null, 2));