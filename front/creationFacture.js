const form = document.getElementById('form-facture');
const msg = document.getElementById('message');
const btnCreer = document.getElementById('btn-creer');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  btnCreer.disabled = true;
  btnCreer.textContent = 'Création en cours...';
  msg.className = 'message';

  const payload = {
    dateFacture: document.getElementById('dateFacture').value,
    description: document.getElementById('ligneDescription').value,
    prixUnitaire: parseFloat(document.getElementById('lignePrixUnitaire').value),
  };

  try {
    const res = await fetch('/api/creation-facture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur inconnue');

    msg.className = 'message succes';
    msg.textContent = `Facture ${data.numero} créée avec succès !`;

    window.open(`/api/creation-facture/${data.id}/pdf`, '_blank');

    form.reset();

  } catch (err) {
    msg.className = 'message erreur';
    msg.textContent = 'Erreur : ' + err.message;
  }

  btnCreer.disabled = false;
  btnCreer.textContent = 'Créer la facture';
});