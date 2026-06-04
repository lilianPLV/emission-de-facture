import express from "express"
import { uploadFichier } from "../services/ChorusFichier.js"
import {soumettreFacture} from "../services/ChorusFacture.js"
const router = express.Router();

router.post("/upload", async (req, res) => {
  const { fichierBase64, nomFichier } = req.body;
  if (!fichierBase64 || !nomFichier) {
    return res.status(400).json({ error: "fichierBase64 et nomFichier sont requis." });
  }
  try {
    const pieceJointeId = await uploadFichier(fichierBase64, nomFichier)
    res.json({ succes: true, pieceJointeId });
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