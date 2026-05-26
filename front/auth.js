const form = document.getElementById('form');
const emailInput = document.getElementById('email');
const pwdInput = document.getElementById('password');
const emailErr = document.getElementById('emailErr');
const pwdErr = document.getElementById('pwdErr');
const submitBtn = document.getElementById('submitBtn');
const eyeBtn = document.getElementById('eyeBtn');
 
const API = 'http://localhost:4000/api/auth';

eyeBtn.addEventListener('click', () => {
  const show = pwdInput.type === 'password';
  pwdInput.type = show ? 'text' : 'password';
  eyeBtn.style.color = show ? '#1a1a1a' : '#aaa';
});

function validate(input, errEl, test) {
  const ok = test(input.value);
  input.classList.toggle('error', !ok);
  errEl.classList.toggle('show', !ok);
  return ok;
}
 
emailInput.addEventListener('input', () => {
  emailInput.classList.remove('error');
  emailErr.classList.remove('show');
});
pwdInput.addEventListener('input', () => {
  pwdInput.classList.remove('error');
  pwdErr.classList.remove('show');
});

form.addEventListener('submit', async e => {
  e.preventDefault();
 
  const okEmail = validate(emailInput, emailErr, v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()));
  const okPwd   = validate(pwdInput,   pwdErr,   v => v.length >= 6);
  if (!okEmail || !okPwd) return;
 
  submitBtn.classList.add('loading');
 
  try {
    const res = await fetch(`${API}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        email:    emailInput.value.trim(),
        password: pwdInput.value,
      }),
    });
 
    const data = await res.json();
 
    if (!res.ok) {
      emailErr.textContent = data.error || 'Identifiants incorrects.';
      emailInput.classList.add('error');
      emailErr.classList.add('show');
      return;
    }

    if(data.messagemail == "ok" && data.messageMDP == "ok") {
      submitBtn.querySelector('.label').textContent = 'Connecté ✓';
      submitBtn.style.background = '#2d6a4f';
      setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
    }
 
  } catch {
    emailErr.textContent = 'Impossible de joindre le serveur.';
    emailInput.classList.add('error');
    emailErr.classList.add('show');
  } finally {
    submitBtn.classList.remove('loading');
  }
});