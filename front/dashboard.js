const uploadZone = document.getElementById("uploadZone");
const inputFichier = document.getElementById("inputFichier");
const fichierInfo = document.getElementById("fichierInfo");
const fichierNom = document.getElementById("fichierNom");
const btnEnvoyer = document.getElementById("btnEnvoyer");
const message = document.getElementById("message");

uploadZone.addEventListener("click", () => inputFichier.click());

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("active");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("active");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("active");
  const fichier = e.dataTransfer.files[0];
  if (fichier && fichier.type === "application/pdf") {
    afficherFichier(fichier);
  }
});

inputFichier.addEventListener("change", () => {
  const fichier = inputFichier.files[0];
  if (fichier) afficherFichier(fichier);
});

function afficherFichier(fichier) {
  fichierNom.textContent = fichier.name;
  fichierInfo.classList.add("visible");
  btnEnvoyer.disabled = false;
  message.className = "message";
  message.textContent = "";
}

btnEnvoyer.addEventListener("click", async () => {
  const fichier = inputFichier.files[0];
  if (!fichier) return;

  btnEnvoyer.disabled = true;
  btnEnvoyer.textContent = "Envoi en cours...";
  message.className = "message";

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];

    try {
      const res = await fetch("/api/facture/deposer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fichierBase64: base64,
          nomFichier: fichier.name,
        }),
      });

      const data = await res.json();

      if (data.succes) {
        message.className = "message succes";
        message.textContent = "Facture envoyée avec succès sur Chorus Pro !";
      } else {
        message.className = "message erreur";
        message.textContent = "Erreur : " + (data.error || "Inconnue");
      }
    } catch (err) {
      message.className = "message erreur";
      message.textContent = "Erreur réseau : " + err.message;
    }

    btnEnvoyer.disabled = false;
    btnEnvoyer.textContent = "Envoyer à Chorus Pro";
  };

  reader.readAsDataURL(fichier);
});
