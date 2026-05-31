import express from "express";
import { uploadFichier, soumettreFacture } from "../API/ChorusPro.js";
const router = express.Router();

router.post("/deposer", async (req, res) => {
  const { fichierBase64, nomFichier } = req.body;

  if (!fichierBase64 || !nomFichier) {
    return res.status(400).json({ error: "fichierBase64 et nomFichier sont requis." });
  }

  try {
    const pieceJointeId = await uploadFichier(fichierBase64, nomFichier);
    const resultat = await soumettreFacture(pieceJointeId, nomFichier);
    res.json({ succes: true, resultat })
  }catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;