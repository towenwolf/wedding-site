(function () {
  var PASSWORD = 'yeehaw';
  var AUTH_KEY = 'wedding-auth';

  var style = document.createElement('style');
  style.textContent =
    'html.gate-locked body > *:not(#pw-gate){display:none!important}' +
    '#pw-gate{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
    'background:#f2ecd9;font-family:Georgia,serif;padding:2rem}' +
    '#pw-gate form{text-align:center;max-width:320px}' +
    '#pw-gate input{font-size:1rem;padding:0.6rem 0.8rem;border:1px solid #a9895a;border-radius:2px;width:100%;margin-top:1rem}' +
    '#pw-gate button{margin-top:0.75rem;padding:0.6rem 1.5rem;background:#3f5c42;color:#f2ecd9;border:none;border-radius:2px;font-size:0.9rem;cursor:pointer}' +
    '#pw-gate .pw-error{display:none;color:#7a4426;margin-top:0.75rem;font-size:0.9rem}';
  document.head.appendChild(style);

  if (sessionStorage.getItem(AUTH_KEY) === '1') return;

  document.documentElement.classList.add('gate-locked');

  document.addEventListener('DOMContentLoaded', function () {
    var overlay = document.createElement('div');
    overlay.id = 'pw-gate';
    overlay.innerHTML =
      '<form>' +
      '<p>This site is password protected.</p>' +
      '<input type="password" autocomplete="off" placeholder="Password" required>' +
      '<button type="submit">Enter</button>' +
      '<p class="pw-error">Incorrect password.</p>' +
      '</form>';
    document.body.prepend(overlay);

    overlay.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = overlay.querySelector('input');
      if (input.value === PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, '1');
        document.documentElement.classList.remove('gate-locked');
        overlay.remove();
      } else {
        overlay.querySelector('.pw-error').style.display = 'block';
        input.value = '';
        input.focus();
      }
    });
  });
})();
