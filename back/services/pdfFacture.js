import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserInstance;
}

function formatMontant(valeur) {
  return Number(valeur).toFixed(2).replace(".", ",");
}

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

function formatDateFr(dateValeur) {
  const d = new Date(dateValeur);
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function genererLignesHTML(lignesPoste) {
  return lignesPoste.map((l) => {
    const totalLigne = l.quantite * l.prixUnitaire;
    return `
      <tr>
        <td>${l.type || "Service"}</td>
        <td>${l.description || "—"}</td>
        <td class="right">${formatMontant(l.prixUnitaire)} €</td>
        <td class="right">${l.quantite}</td>
        <td class="right">${formatMontant(totalLigne)} €</td>
      </tr>
    `;
  }).join("");
}

function calculerTotal(lignesPoste) {
  return lignesPoste.reduce((acc, l) => acc + l.quantite * l.prixUnitaire, 0);
}

//Genere le pfd
export async function genererFacturePDF(facture) {
  const templatePath = path.join(__dirname, "..", "templates", "facture.html");
  let html = await fs.readFile(templatePath, "utf-8");

  const montantTotal = calculerTotal(facture.lignesPoste);
  const e = facture.emetteur || {};

  const remplacements = {
    numeroFacture: facture.numeroFacture,
    dateFacture: formatDateFr(facture.dateFacture),
    emetteurSociete: e.societe,
    emetteurContact: e.contact,
    emetteurAdresse: e.adresse,
    emetteurPays: e.pays,
    emetteurSiret: e.siret,
    emetteurTelephone: e.telephone,
    emetteurEmail: e.email,
    emetteurSite: e.site,
    destinataireNom: facture.destinataireNom,
    titrePrestation: facture.titrePrestation,
    lignesFacture: genererLignesHTML(facture.lignesPoste),
    mentionTva: facture.mentionTva,
    montantTotal: formatMontant(montantTotal),
    conditionsReglement: facture.conditionsReglement,
    modeReglement: facture.modeReglement,
    interetsRetard: facture.interetsRetard,
  };

  for (const [cle, valeur] of Object.entries(remplacements)) {
    html = html.replaceAll(`{{${cle}}}`, valeur ?? "");
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return pdfBuffer;
  } finally {
    await page.close();
  }
}

//A executer a la fermeture
export async function fermerBrowserPdf() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}