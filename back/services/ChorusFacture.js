import { apiPost } from "./chorusAuth.js";

function construirePiecesJointes(idRIB, nomRIB, idBonCommande, nomFichierBonCommande,){
  const pieces = [];
  if (idRIB)
    pieces.push({
      pieceJointeComplementaireId: idRIB,
      pieceJointeComplementaireDesignation: nomRIB,
      pieceJointeComplementaireType: "RIB",
    });
  //PROD: remettre pieceJointeComplementaireType: "BON_DE_COMMANDE"
  // La sandbox Chorus Pro rejette ce type
  if (idBonCommande)
    pieces.push({
      pieceJointeComplementaireId: idBonCommande,
      pieceJointeComplementaireDesignation: nomFichierBonCommande,
      pieceJointeComplementaireType:
        process.env.NODE_ENV === "production" ? "BON_DE_COMMANDE" : "RIB",
    });
  return pieces;
}

export async function soumettreFacture({
  numeroFacture,
  dateFacture,
  siretDestinataire,
  codeService,
  libelleService,
  typeTva,
  lignesPoste,
  montantHT,
  montantTVA,
  montantTTC,
  idFichierFacture,
  nomFichierFacture,
  idFichierRIB,
  nomFichierRIB,
  idFichierBonCommande,
  nomFichierBonCommande,
}) {
  // SAISIE_API met des erreurs en sandbox alors on le remplace par DEPOT_PDF_API
  const modeDepot = "DEPOT_PDF_API";

  const body = {
    "numeroFactureSaisi": numeroFacture,
    "dateFacture": dateFacture,
    "cadreDeFacturation": {
      "codeCadreFacturation": "A1_FACTURE_FOURNISSEUR",
    },
    "destinataire": {
      "codeDestinataire": siretDestinataire,
    },
    "fournisseur": {
      "codeCoordonneesBancairesFournisseur": parseInt(
        process.env.CHORUS_CODE_RIB,
      ),
      "idFournisseur": parseInt(process.env.CHORUS_ID_STRUCTURE),
    },
    "idUtilisateurCourant": parseInt(process.env.CHORUS_ID_RATTACHEMENT),
    "lignePoste": lignesPoste.map((ligne, index) => ({
      "lignePosteDenomination": ligne.denomination,
      "lignePosteMontantRemiseHT": 0,
      "lignePosteMontantUnitaireHT": Number(ligne.prixUnitaireHT),
      "lignePosteNumero": index + 1,
      "lignePosteQuantite": Number(ligne.quantite),
      "lignePosteReference": ligne.reference || "",
      "lignePosteTauxTvaManuel": Number(ligne.tauxTva),
      "lignePosteUnite": ligne.unite || "unité",
    })),
    "ligneTva": [],
    "modeDepot": modeDepot,
    "montantTotal": {
      "montantAPayer": Math.round(montantTTC * 10000) / 10000,
      "montantHtTotal": Math.round(montantHT * 10000) / 10000,
      "montantRemiseGlobaleTTC": 0,
      "montantTVA": Math.round(montantTVA * 10000) / 10000,
      "montantTtcTotal": Math.round(montantTTC * 10000) / 10000,
    },
    pieceJointePrincipale: [
      {
        pieceJointePrincipaleDesignation: nomFichierFacture,
        pieceJointePrincipaleId: idFichierFacture,
      },
    ],
    ...(() => {
      const pj = construirePiecesJointes(
        idFichierRIB,
        nomFichierRIB,
        idFichierBonCommande,
        nomFichierBonCommande,
      );
      return pj.length > 0 ? { pieceJointeComplementaire: pj } : {};
    })(),
    "references": {
      "deviseFacture": "EUR",
      "modePaiement": "VIREMENT",
      "typeFacture": "FACTURE",
      "typeTva": typeTva || "SANS TVA",
    },
  };

  console.log("📤 Body envoyé à Chorus Pro :", JSON.stringify(body, null, 2));
  const data = await apiPost("/factures/v1/soumettre", body);
  console.log("Réponse Chorus Pro :", JSON.stringify(data, null, 2));
  if (data.codeRetour !== 0)
    throw new Error(`Soumission échouée : ${data.libelle}`);
  return data;
}
