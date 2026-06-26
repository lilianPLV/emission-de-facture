const state = {
  fichiers: { facture: null, rib: null, bc: null },
  ids: { facture: null, rib: null, bc: null },
  etape: 1,
  historique: JSON.parse(localStorage.getItem('chorus-historique') || '[]'),
};

const heroContenu = {
  dashboard: ['Tableau de bord', 'Bienvenue sur votre espace Chorus Pro'],
  historique: ['Historique des factures', 'Retrouvez toutes vos factures émises'],
  formulaire1: ['Chargement des documents', 'Ajoutez votre facture PDF et les pièces jointes'],
  formulaire2: ['Informations de la facture', 'Renseignez les champs requis par Chorus Pro'],
  formulaire3: ['Récapitulatif', "Vérifiez tout avant d'envoyer à Chorus Pro"],
};

function afficherVue(nom) {
  document.querySelectorAll('.vue').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  const stepperEl = document.getElementById('stepper-wrap');
  const isForm = nom === 'formulaire';
  stepperEl.style.display = isForm ? 'block' : 'none';

  if (nom === 'formulaire') {
    document.getElementById('vue-formulaire').classList.add('active');
    majHero('formulaire' + state.etape);
  } else {
    document.getElementById('vue-' + nom).classList.add('active');
    const tab = document.querySelector(`.tab[data-vue="${nom}"]`);
    if (tab) tab.classList.add('active');
    majHero(nom);
    if (nom === 'dashboard') majDashboard();
  }
}

function majHero(cle) {
  const [titre, sous] = heroContenu[cle] || heroContenu.dashboard;
  document.getElementById('hero-titre').textContent = titre;
  document.getElementById('hero-sous').textContent  = sous;
}

document.querySelector('.logo-text').style.cursor = 'pointer';
document.querySelector('.logo-text').addEventListener('click', () => afficherVue('dashboard'));

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => afficherVue(tab.dataset.vue));
});

function nouvelleEmission() {
  state.fichiers = { facture: null, rib: null, bc: null };
  state.ids = { facture: null, rib: null, bc: null };
  state.etape = 1;

  ['facture','rib','bc'].forEach(k => {
    const status = document.getElementById('status-' + k);
    const item = document.getElementById('item-' + k);
    const input = document.getElementById('input-' + k);
    if (status) { status.textContent = 'Aucun fichier sélectionné'; status.classList.remove('ok'); }
    if (item) item.classList.remove('done');
    if (input) input.value = '';
  });

  document.getElementById('btn-etape1').disabled = true;
  document.getElementById('lignes-container').innerHTML = '';
  document.getElementById('message').className = 'message';
  reinitStepper();
  afficherVue('formulaire');
  ajouterLigne();
}

function setupUpload(inputId, key, statusId, itemId) {
  document.getElementById(inputId).addEventListener('change', function () {
    const fichier = this.files[0];
    if (!fichier) return;
    state.fichiers[key] = fichier;
    state.ids[key] = null;
    const el = document.getElementById(statusId);
    el.textContent = '✓ ' + fichier.name;
    el.classList.add('ok');
    document.getElementById(itemId).classList.add('done');
    verifierEtape1();
  });
}

setupUpload('input-facture', 'facture', 'status-facture', 'item-facture');
setupUpload('input-rib', 'rib', 'status-rib', 'item-rib');
setupUpload('input-bc', 'bc', 'status-bc', 'item-bc');

function verifierEtape1() {
  const ok = !!state.fichiers.facture && !!state.fichiers.rib && !!state.fichiers.bc;
  document.getElementById('btn-etape1').disabled = !ok;
}

function reinitStepper() {
  for (let i = 1; i <= 3; i++) {
    const s = document.getElementById('step' + i);
    s.classList.remove('active', 'done');
  }
  for (let i = 1; i <= 2; i++) {
    document.getElementById('line' + i).classList.remove('done');
  }
  document.getElementById('step1').classList.add('active');
  document.querySelectorAll('.etape').forEach(e => e.classList.remove('active'));
  document.getElementById('etape1').classList.add('active');
}

function allerEtapeForm(n) {
  const old = state.etape;
  document.getElementById('etape' + old).classList.remove('active');
  const stepOld = document.getElementById('step' + old);
  stepOld.classList.remove('active');
  if (n > old) stepOld.classList.add('done');
  if (old > 1) document.getElementById('line' + (old - 1)).classList.add('done');

  state.etape = n;
  document.getElementById('etape' + n).classList.add('active');
  const stepNew = document.getElementById('step' + n);
  stepNew.classList.remove('done');
  stepNew.classList.add('active');

  majHero('formulaire' + n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function allerEtape2() {
  const btn     = document.getElementById('btn-etape1');
  const loading = document.getElementById('upload-loading');
  btn.disabled    = true;
  btn.textContent = 'Upload...';
  loading.classList.add('visible');

  try {
    for (const key of ['facture', 'rib', 'bc']) {
      if (state.fichiers[key] && !state.ids[key]) {
        const base64 = await lireEnBase64(state.fichiers[key]);
        const res = await fetch('/api/facture/upload', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ fichierBase64: base64, nomFichier: state.fichiers[key].name }),
        });
        const data = await res.json();
        if (!data.succes) throw new Error(data.error);
        state.ids[key] = data.pieceJointeId;

        if (key === 'facture' && data.champs) {
          const c = data.champs;
          if (c.numero) document.getElementById('numeroFacture').value = c.numero;
          if (c.date)   document.getElementById('dateFacture').value   = c.date;

          if (c.lignes?.length) {
            document.getElementById('lignes-container').innerHTML = '';
            ligneCount = 0;
            for (const l of c.lignes) {
              ajouterLigne();
              const inputs = document.querySelectorAll('.ligne-facture:last-child input, .ligne-facture:last-child select');
              inputs[0].value = l.denomination;
              inputs[1].value = l.quantite;
              inputs[2].value = l.prixUnitaireHT;
              inputs[3].value = l.tauxTva;
            }
            calculerTotaux();
          }
        }
      }
    }
    allerEtapeForm(2);
    if (document.querySelectorAll('.ligne-facture').length === 0) ajouterLigne();
  } catch (err) {
    alert("Erreur lors de l'upload : " + err.message);
  }

  loading.classList.remove('visible');
  btn.textContent = 'Continuer →';
  btn.disabled    = false;
}

function allerEtape3() {
  if (!document.getElementById('numeroFacture').value) return alert('Numéro de facture requis');
  if (!document.getElementById('dateFacture').value) return alert('Date de facture requise');
  if (!document.getElementById('siretDestinataire').value) return alert('SIRET destinataire requis');
  if (getLignes().length === 0) return alert('Au moins une ligne de facture requise');

  document.getElementById('r-numero').textContent = document.getElementById('numeroFacture').value;
  document.getElementById('r-date').textContent  = document.getElementById('dateFacture').value;
  document.getElementById('r-siret').textContent = document.getElementById('siretDestinataire').value;

  const tvaSel = document.getElementById('typeTva');
  document.getElementById('r-tva').textContent = tvaSel.options[tvaSel.selectedIndex].text;
  document.getElementById('r-codeservice').textContent = document.getElementById('codeService').value  || '—';
  document.getElementById('r-libelleservice').textContent = document.getElementById('libelleService').value || '—';

  const rLignes = document.getElementById('r-lignes');
  rLignes.innerHTML = '';
  let ht = 0, tva = 0;
  for (const l of getLignes()) {
    const m = l.quantite * l.prixUnitaireHT;
    ht  += m;
    tva += m * (l.tauxTva / 100);
    const div = document.createElement('div');
    div.className = 'recap-ligne';
    div.innerHTML = `<span>${l.denomination || '—'}</span><span>${l.quantite}</span><span>${l.prixUnitaireHT.toFixed(2)} €</span><span>${l.tauxTva}%</span>`;
    rLignes.appendChild(div);
  }
  document.getElementById('r-ht').textContent = ht.toFixed(2) + ' €';
  document.getElementById('r-tvatotal').textContent = tva.toFixed(2) + ' €';
  document.getElementById('r-ttc').textContent = (ht + tva).toFixed(2) + ' €';

  const rFichiers = document.getElementById('r-fichiers');
  rFichiers.innerHTML = '';
  [
    { key: 'facture', label: 'Facture PDF' },
    { key: 'rib',     label: 'Coordonnées bancaires' },
    { key: 'bc',      label: 'Bon de commande' },
  ].forEach(({ key, label }) => {
    const div = document.createElement('div');
    div.className = 'recap-fichier';
    const present = !!state.fichiers[key];
    div.innerHTML = `
      <div class="recap-fichier-dot ${present ? '' : 'absent'}"></div>
      <span>${label} ${present ? '— ' + state.fichiers[key].name : '— Non fourni'}</span>
    `;
    rFichiers.appendChild(div);
  });

  allerEtapeForm(3);
}

let ligneCount = 0;

function ajouterLigne() {
  ligneCount++;
  const id  = ligneCount;
  const div = document.createElement('div');
  div.className = 'ligne-facture';
  div.id = `ligne-${id}`;
  div.innerHTML = `
    <div class="field">
      <label>Désignation</label>
      <input type="text" placeholder="Prestation..." oninput="calculerTotaux()">
    </div>
    <div class="field">
      <label>Quantité</label>
      <input type="number" value="1" min="0.01" step="0.01" oninput="calculerTotaux()">
    </div>
    <div class="field">
      <label>PU HT (€)</label>
      <input type="number" value="0" min="0" step="0.01" oninput="calculerTotaux()">
    </div>
    <div class="field">
      <label>TVA (%)</label>
      <select oninput="calculerTotaux()">
        <option value="20">20%</option>
        <option value="10">10%</option>
        <option value="5.5">5.5%</option>
        <option value="0">0%</option>
      </select>
    </div>
    <button class="btn-suppr" onclick="supprimerLigne(${id})" title="Supprimer">×</button>
  `;
  document.getElementById('lignes-container').appendChild(div);
  calculerTotaux();
}

function supprimerLigne(id) {
  const el = document.getElementById(`ligne-${id}`);
  if (el) el.remove();
  calculerTotaux();
}

function getLignes() {
  const lignes = [];
  document.querySelectorAll('.ligne-facture').forEach(div => {
    const inputs = div.querySelectorAll('input, select');
    lignes.push({
      denomination: inputs[0].value,
      quantite: parseFloat(inputs[1].value) || 0,
      prixUnitaireHT: parseFloat(inputs[2].value) || 0,
      tauxTva: parseFloat(inputs[3].value) || 0,
      unite: 'unité',
    });
  });
  return lignes;
}

function calculerTotaux() {
  let ht = 0, tva = 0;
  for (const l of getLignes()) {
    const m = l.quantite * l.prixUnitaireHT;
    ht  += m;
    tva += m * (l.tauxTva / 100);
  }
  document.getElementById('total-ht').textContent = ht.toFixed(2) + ' €';
  document.getElementById('total-tva').textContent = tva.toFixed(2) + ' €';
  document.getElementById('total-ttc').textContent = (ht + tva).toFixed(2) + ' €';
}

async function envoyerFacture() {
  const btn = document.getElementById('btn-envoyer');
  btn.disabled = true;
  btn.textContent = 'Envoi en cours...';

  const lignes = getLignes();
  let ht = 0, tva = 0;
  for (const l of lignes) {
    const m = l.quantite * l.prixUnitaireHT;
    ht  += m;
    tva += m * (l.tauxTva / 100);
  }

  const payload = {
    numeroFacture: document.getElementById('numeroFacture').value,
    dateFacture: document.getElementById('dateFacture').value,
    siretDestinataire: document.getElementById('siretDestinataire').value,
    codeService: document.getElementById('codeService').value || null,
    libelleService: document.getElementById('libelleService').value || null,
    typeTva: document.getElementById('typeTva').value,
    lignesPoste: lignes,
    montantHT: ht,
    montantTVA: tva,
    montantTTC: ht + tva,
    idFichierFacture:  state.ids.facture,
    nomFichierFacture: state.fichiers.facture?.name,
    idFichierRIB: state.ids.rib || null,
    nomFichierRIB: state.fichiers.rib?.name || null,
    idFichierBonCommande: state.ids.bc || null,
    nomFichierBonCommande: state.fichiers.bc?.name || null,
  };

  const msg = document.getElementById('message');

  try {
    const res  = await fetch('/api/facture/soumettre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.succes) {
      const entree = {
        numero: payload.numeroFacture,
        date: payload.dateFacture,
        siret: payload.siretDestinataire,
        montant: (ht + tva).toFixed(2),
        statut: 'envoye',
      };
      state.historique.unshift(entree);
      localStorage.setItem('chorus-historique', JSON.stringify(state.historique));
      majHistorique();
      majDashboard();
      majStats();

      msg.className = 'message succes';
      msg.innerHTML = `
        Facture envoyée avec succès sur Chorus Pro !<br><br>
        <button onclick="afficherVue('dashboard')" style="margin-top:10px;padding:10px 20px;background:#fff;color:#1a6b3c;border:2px solid #1a6b3c;border-radius:8px;cursor:pointer;font-weight:600;">
          ← Retour au tableau de bord
        </button>
        &nbsp;
        <button onclick="nouvelleEmission()" style="margin-top:10px;padding:10px 20px;background:#1a6b3c;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
          + Nouvelle facture
        </button>
      `;
    } else {
      msg.className = 'message erreur';
      msg.textContent = 'Erreur : ' + (data.error || 'Inconnue');
    }
  } catch (err) {
    msg.className = 'message erreur';
    msg.textContent = 'Erreur réseau : ' + err.message;
  }

  btn.disabled = false;
  btn.textContent = 'Envoyer à Chorus Pro';
}

function majHistorique() {
  const tbody = document.getElementById('tbody-historique');
  const empty = document.getElementById('empty-historique');

  if (state.historique.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = state.historique.map(f => `
    <tr>
      <td><strong>${f.numero}</strong></td>
      <td>${f.date}</td>
      <td>${f.siret}</td>
      <td><strong>${f.montant} €</strong></td>
      <td><span class="badge-statut ${f.statut}">${f.statut === 'envoye' ? '✓ Envoyé' : f.statut}</span></td>
    </tr>
  `).join('');
}


function majDashboard() {
  const tbody = document.getElementById("tbody-dashboard");
  const empty = document.getElementById("empty-dashboard");
  if (state.historique.length === 0) {
    tbody.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  tbody.innerHTML = state.historique.slice(0, 5).map(f => `
    <tr>
      <td><strong>${f.numero}</strong></td>
      <td>${f.date}</td>
      <td>${f.siret}</td>
      <td><strong>${f.montant} €</strong></td>
      <td><span class="badge-statut ${f.statut}">${f.statut === "envoye" ? "✓ Envoyé" : f.statut}</span></td>
    </tr>
  `).join("");
}
function majStats() {
  const total = state.historique.length;
  const envoyes = state.historique.filter(f => f.statut === 'envoye').length;
  const montant = state.historique.reduce((s, f) => s + parseFloat(f.montant), 0);

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-envoyes').textContent = envoyes;
  document.getElementById('stat-montant').textContent = montant.toFixed(2) + ' €';
}

function lireEnBase64(fichier) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(fichier);
  });
}

majDashboard();
majHistorique();
majStats();
afficherVue('dashboard');