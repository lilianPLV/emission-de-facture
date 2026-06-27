import express from "express"
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const pdfParse = require("pdf-parse")
import { uploadFichier } from "../services/ChorusFichier.js"
import { soumettreFacture } from "../services/ChorusFacture.js"
import { genererFacturePDF } from "../services/pdfFacture.js"
const router = express.Router();

function extraireChamps(texte) {
  //récupere le nom de la facture
  const numero = (texte.match(/Facture\s+(F\d+)/) || [])[1] || null;

  //transcrire le mois de lettre a nombre
  const mois = {
    janvier:'01', février:'02', mars:'03', avril:'04',
    mai:'05', juin:'06', juillet:'07', août:'08',
    septembre:'09', octobre:'10', novembre:'11', décembre:'12'
  };
  const dateMatch = texte.match(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i);
  const date = dateMatch
    ? `${dateMatch[3]}-${mois[dateMatch[2].toLowerCase()]}-${dateMatch[1].padStart(2,'0')}`
    : null;

  //Récuperation de la quantité de séance et de prix de la séance et le nom de la séance
  const ligneMatch = texte.match(/Service(.+?)(\d[\d ]*,\d{2})\s*€(\d+),(\d{2})\s*€/);
  let lignes = [];
  if (ligneMatch) {
    const desc     = ligneMatch[1].trim();
    const prixStr  = ligneMatch[2].replace(/ /g,'');
    const prix     = parseFloat(prixStr.replace(',','.'));
    const collé    = ligneMatch[3];
    const dec      = ligneMatch[4];
    const prixEntier = prixStr.split(',')[0];
    let qte = 1;
    if (collé.endsWith(prixEntier)) {
      const qteStr = collé.slice(0, collé.length - prixEntier.length);
      qte = qteStr ? parseInt(qteStr, 10) : 1;
    } else {
      const total = parseFloat(collé + '.' + dec);
      qte = prix > 0 ? Math.round(total / prix) : 1;
    }
    lignes = [{ denomination: desc, prixUnitaireHT: prix, quantite: qte, tauxTva: 0 }];
  }

  return { numero, date, lignes };
}

router.post("/upload", async (req, res) => {
  const { fichierBase64, nomFichier } = req.body;
  if (!fichierBase64 || !nomFichier) {
    return res.status(400).json({ error: "fichierBase64 et nomFichier sont requis." });
  }
  try {
    const pieceJointeId = await uploadFichier(fichierBase64, nomFichier);
    let champs = null;
    if (nomFichier.toLowerCase().endsWith('.pdf')) {
      try {
        const buffer = Buffer.from(fichierBase64, 'base64');
        const data   = await pdfParse(buffer);
        champs = extraireChamps(data.text);
      } catch (e) {
        console.warn('pdf-parse extraction échouée :', e.message);
      }
    }

    res.json({ succes: true, pieceJointeId, champs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pdf", async (req, res) => {
  const { numeroFacture, dateFacture, lignesPoste } = req.body;

  const champsManquants = [];
  if (!numeroFacture) champsManquants.push("numeroFacture");
  if (!dateFacture) champsManquants.push("dateFacture");
  if (!lignesPoste || lignesPoste.length === 0) champsManquants.push("lignesPoste");
  if (champsManquants.length > 0) {
    return res.status(400).json({ error: `Champs manquants : ${champsManquants.join(", ")}` });
  }

  try {
    const pdfBuffer = await genererFacturePDF({ numeroFacture, dateFacture, lignesPoste });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="facture-${numeroFacture}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/soumettre", async (req, res) => {
  const {
    numeroFacture, dateFacture, siretDestinataire,
    codeService, libelleService, typeTva,
    lignesPoste, montantHT, montantTVA, montantTTC,
    idFichierFacture, nomFichierFacture,
    idFichierRIB, nomFichierRIB,
    idFichierBonCommande, nomFichierBonCommande,
  } = req.body;

  const champsManquants = [];
  if (!numeroFacture) champsManquants.push("numeroFacture");
  if (!dateFacture) champsManquants.push("dateFacture");
  if (!siretDestinataire) champsManquants.push("siretDestinataire");
  if (!lignesPoste || lignesPoste.length === 0) champsManquants.push("lignesPoste");
  if (!idFichierFacture) champsManquants.push("idFichierFacture");
  if (champsManquants.length > 0) {
    return res.status(400).json({ error: `Champs manquants : ${champsManquants.join(", ")}` });
  }

  try {
    const resultat = await soumettreFacture({
      numeroFacture, dateFacture, siretDestinataire,
      codeService, libelleService, typeTva,
      lignesPoste, montantHT, montantTVA, montantTTC,
      idFichierFacture, nomFichierFacture,
      idFichierRIB, nomFichierRIB,
      idFichierBonCommande, nomFichierBonCommande,
    });
    res.json({ succes: true, resultat });
  } 
  catch (err) {
    res.status(500).json({ error: err.message })
  }
});
export default router;