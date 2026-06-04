import {apiPost} from "./chorusAuth.js";

function construireLignesTva(lignesPoste) {
  const tvaMap = {};
  for (const ligne of lignesPoste) {
    const taux = ligne.tauxTva;
    const montantHtLigne = ligne.quantite * ligne.prixUnitaireHT;
    const montantTvaLigne = montantHtLigne * (taux / 100);
    if (!tvaMap[taux]) tvaMap[taux] = { baseHT: 0, montantTva: 0 };
    tvaMap[taux].baseHT += montantHtLigne;
    tvaMap[taux].montantTva += montantTvaLigne;
  }

  return Object.entries(tvaMap).map(([taux, vals]) => ({
    ligneTvaMontantBaseHtParTaux: Math.round(vals.baseHT * 10000) / 10000,
    ligneTvaMontantTvaParTaux: Math.round(vals.montantTva * 10000) / 10000,
    ligneTvaTauxManuel: parseFloat(taux),
  }));
}

function construireLignesPoste(lignesPoste) {
  return lignesPoste.map((ligne, index) => ({
    lignePosteNumero: index + 1,
    lignePosteDenomination: ligne.denomination,
    lignePosteReference: ligne.reference || "",
    lignePosteQuantite: ligne.quantite,
    lignePosteMontantUnitaireHT: ligne.prixUnitaireHT,
    lignePosteMontantRemiseHT: 0,
    lignePosteTauxTvaManuel: ligne.tauxTva,
    lignePosteUnite: ligne.unite || "unité",
  }));
}

function construirePiecesJointes(idRIB, nomRIB, idBonCommande, nomBonCommande) {
  const pieces = [];
  if (idRIB) pieces.push({
    pieceJointeComplementaireId: idRIB,
    pieceJointeComplementaireDesignation: nomRIB,
    pieceJointeComplementaireType: "RIB",
  });
  if (idBonCommande) pieces.push({
    pieceJointeComplementaireId: idBonCommande,
    pieceJointeComplementaireDesignation: nomBonCommande,
    pieceJointeComplementaireType: "BON_DE_COMMANDE",
  });
  return pieces;
}

export async function soumettreFacture({
  numeroFacture, dateFacture, siretDestinataire,
  codeService, libelleService, typeTva,
  lignesPoste, montantHT, montantTVA, montantTTC,
  idFichierFacture, nomFichierFacture,
  idFichierRIB, nomFichierRIB,
  idFichierBonCommande, nomFichierBonCommande,
}) {
  const body = {
    numeroFactureSaisi: numeroFacture,
    dateFacture: dateFacture,
    cadreDeFacturation: {
      codeCadreFacturation: "A1_FACTURE_FOURNISSEUR",
    },
    destinataire: {
      codeDestinataire: siretDestinataire,
      codeServiceExecutant: codeService || undefined,
      libelleServiceExecutant: libelleService || undefined,
    },
    fournisseur: {
      idFournisseur: parseInt(process.env.CHORUS_ID_STRUCTURE),
      codeCoordonneesBancairesFournisseur: parseInt(process.env.CHORUS_CODE_RIB),
    },
    idUtilisateurCourant: parseInt(process.env.CHORUS_ID_RATTACHEMENT),
    lignePoste: construireLignesPoste(lignesPoste),
    ligneTva: construireLignesTva(lignesPoste),
    modeDepot: "DEPOT_PDF_API",
    montantTotal: {
      montantHtTotal: Math.round(montantHT * 10000) / 10000,
      montantTVA: Math.round(montantTVA * 10000) / 10000,
      montantTtcTotal: Math.round(montantTTC * 10000) / 10000,
      montantAPayer: Math.round(montantTTC * 10000) / 10000,
      montantRemiseGlobaleTTC: 0,
    },
    pieceJointePrincipale: [{
      pieceJointePrincipaleId: idFichierFacture,
      pieceJointePrincipaleDesignation: nomFichierFacture,
    }],
    pieceJointeComplementaire: construirePiecesJointes(
      idFichierRIB, nomFichierRIB,
      idFichierBonCommande, nomFichierBonCommande
    ),
    references: {
      deviseFacture: "EUR",
      modePaiement: "VIREMENT",
      typeFacture: "FACTURE",
      typeTva: typeTva,
    },
  };

  const data = await apiPost("/factures/v1/soumettre", body);
  if (data.codeRetour !== 0) throw new Error(`Soumission échouée : ${data.libelle}`);
  return data;
}