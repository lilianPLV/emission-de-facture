import pool from "../db.js";

export async function genererProchainNumero() {
  const anneeCourante = new Date().getFullYear();
  const suffixeAnnee = String(anneeCourante).slice(-2);//prend le 26 de 2026

  const [rows] = await pool.query(
    "SELECT numero_facture FROM lignes_facture WHERE numero_facture LIKE ? ORDER BY id DESC LIMIT 1",
    [`F${suffixeAnnee}%`]
  );

  let prochainCompteur = 1;

  if (rows.length > 0) {
    const dernierNumero = rows[0].numero_facture; //numero de la Facture
    const dernierCompteur = parseInt(dernierNumero.slice(3), 10);
    prochainCompteur = dernierCompteur + 1;
  }

  const compteurFormate = String(prochainCompteur).padStart(5, "0");
  return `F${suffixeAnnee}${compteurFormate}`;
}