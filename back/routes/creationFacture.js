import express from "express";
import pool from "../db.js";
import { genererProchainNumero } from "../services/numeroFacture.js";
import { genererFacturePDF } from "../services/pdfFacture.js";

const router = express.Router();

// Valeurs fixes de l'émetteur, du destinataire et des conditions —
// identiques sur toutes les factures
const EMETTEUR = {
  societe: "ouvrirsesailes EI",
  contact: "Marie PULVERIN - Praticienne en psychopédagogie positive",
  adresse: "14, rue des jardins du temple, 45170 NEUVILLE AUX BOIS",
  pays: "France",
  siret: "914780341",
  telephone: "0652271247",
  email: "marie.pulverin@ouvrirsesailes.fr",
  site: "www.ouvrirsesailes.fr",
};
const DESTINATAIRE_NOM = "Département du Loiret Pôle Citoyenneté et Cohésion Sociale";
const TITRE_PRESTATION = "CONSULTATIONS DE PSYCHOPEDAGOGIE POSITIVE";
const CONDITIONS_REGLEMENT = "À réception";
const MODE_REGLEMENT = "Virement bancaire";
const INTERETS_RETARD = "2% par mois";
const MENTION_TVA = "TVA non applicable, art. 293 B du CGI";

/**
 * POST /api/creation-facture
 * Crée une nouvelle facture à partir de seulement 3 champs saisis :
 * dateFacture, description, prixUnitaire. Le reste est fixe.
 */
router.post("/", async (req, res) => {
  const { dateFacture, description, prixUnitaire } = req.body;

  if (!dateFacture || !description || prixUnitaire == null) {
    return res.status(400).json({ error: "dateFacture, description et prixUnitaire sont obligatoires" });
  }

  try {
    const numero = await genererProchainNumero();

    const [result] = await pool.query(
      `INSERT INTO lignes_facture (numero_facture, date_facture, description, prix_unitaire)
       VALUES (?, ?, ?, ?)`,
      [numero, dateFacture, description, prixUnitaire]
    );

    res.status(201).json({ id: result.insertId, numero });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/creation-facture
 * Liste l'historique des factures créées.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, numero_facture, date_facture, description, prix_unitaire FROM lignes_facture ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/pdf", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM lignes_facture WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Facture introuvable" });
    }
    const facture = rows[0];

    const pdfBuffer = await genererFacturePDF({
      numeroFacture: facture.numero_facture,
      dateFacture: facture.date_facture,
      titrePrestation: TITRE_PRESTATION,
      emetteur: EMETTEUR,
      destinataireNom: DESTINATAIRE_NOM,
      conditionsReglement: CONDITIONS_REGLEMENT,
      modeReglement: MODE_REGLEMENT,
      interetsRetard: INTERETS_RETARD,
      mentionTva: MENTION_TVA,
      lignesPoste: [
        { type: "Service", description: facture.description, prixUnitaire: facture.prix_unitaire, quantite: 1 }
      ],
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="facture-${facture.numero_facture}.pdf"`);
    res.send(pdfBuffer);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;