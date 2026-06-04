import {apiPost} from "./chorusAuth.js";

export async function uploadFichier(fichierBase64, nomFichier) {
    const data = await apiPost("/transverses/v1/ajouter/fichier", {
        pieceJointeExtension: "pdf",
        pieceJointeFichier: fichierBase64,
        pieceJointeNom: nomFichier,
        pieceJointeTypeMime: "application/pdf",
    });
    if (data.codeRetour !== 0) throw new Error(`Upload échoué : ${data.libelle}`);
    return data.pieceJointeId;
}