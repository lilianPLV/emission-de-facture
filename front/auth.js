const form = document.getElementById('form');
const emailInput = document.getElementById('email');
const pwdInput = document.getElementById('password');
const emailErr = document.getElementById('emailErr');
const pwdErr = document.getElementById('pwdErr');
const submitBtn = document.getElementById('submitBtn');
const eyeBtn = document.getElementById('eyeBtn');

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

form.addEventListener('submit', async e => {
  e.preventDefault();
  const okEmail = validate(emailInput, emailErr, v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()));
  const okPwd = validate(pwdInput, pwdErr, v => v.length >= 6);
  if (!okEmail || !okPwd) return;
  submitBtn.classList.add('loading');
  await new Promise(r => setTimeout(r, 1600));
  submitBtn.classList.remove('loading');
  submitBtn.querySelector('.label').textContent = 'Connecté ✓';
  submitBtn.style.background = '#2d6a4f';
});

emailInput.addEventListener('input', () => { emailInput.classList.remove('error'); emailErr.classList.remove('show'); });
pwdInput.addEventListener('input', () => { pwdInput.classList.remove('error'); pwdErr.classList.remove('show'); });