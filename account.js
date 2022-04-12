let sessionId = null;

function initAccountControls() {
  document.getElementById('loginButton').onclick = () => {
    document.getElementById('loginErrorRow').classList.add('hidden');
    openModal('loginModal');
  };
  document.getElementById('logoutButton').onclick = () => {
    sessionId = null;
    setCookie('sessionId', null);
    document.getElementById('content').classList.remove('loggedIn');
    fetchAndUpdatePlayerInfo().then(_ =>  showAccountToastMessage('loggedOut', 'leave'));
  };

  document.getElementById('loginForm').onsubmit = function () {
    const form = this;
    closeModal();
    fetch(`${apiUrl}/login?${new URLSearchParams(new FormData(form)).toString()}`)
      .then(response => {
        if (!response.ok) {
          response.text().then(error => {
            document.getElementById('loginError').innerHTML = getMassagedLabel(localizedMessages.account.login.errors.invalidLogin, true);
            document.getElementById('loginErrorRow').classList.remove('hidden');
            openModal('loginModal');
          });
          return;
        }
        return response.text();
      }).then(sId => {
        fetchAndUpdatePlayerInfo()
          .then(playerData => {
            sessionId = sId;
            setCookie('sessionId', sessionId);
            showAccountToastMessage('loggedIn', 'join', getPlayerName(playerData, true, true));
            document.getElementById('content').classList.add('loggedIn');
          })
          .catch(err => console.error(err));
      }).catch(err => console.error(err));
    return false;
  };

  document.getElementById('registerForm').onsubmit = function () {
    const form = this;
    if (document.getElementById('registerPassword').value !== document.getElementById('registerConfirmPassword').value) {
      document.getElementById('registerError').innerHTML = getMassagedLabel(localizedMessages.account.register.errors.confirmPasswordMismatch, true);
      document.getElementById('registerErrorRow').classList.remove('hidden');
      return false;
    }
    closeModal();
    fetch(`${apiUrl}/register?${new URLSearchParams(new FormData(form)).toString()}`)
      .then(response => {
        if (!response.ok) {
          response.text().then(error => {
            document.getElementById('registerError').innerHTML = getMassagedLabel(localizedMessages.account.register.errors[error === 'user exists' ? 'usernameTaken' : 'invalidCredentials'], true);
            document.getElementById('registerErrorRow').classList.remove('hidden');
            openModal('registerModal');
          });
          return;
        }
        document.getElementById('loginErrorRow').classList.add('hidden');
        openModal('loginModal');
      })
      .catch(err => console.error(err));
    return false;
  };
}

function showAccountToastMessage(key, icon, username) {
  if (!globalConfig.notifications.account.all || !globalConfig.notifications.account[key])
    return;
  let message = getMassagedLabel(localizedMessages.toast.account[key], true).replace('{USER}', username);
  showToastMessage(message, icon);
}

function setCookie(cName, cValue) {
  document.cookie = `${cName}=${cValue};SameSite=Strict;path=/`;
}

function getCookie(cName) {
  const name = `${cName}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ')
      c = c.substring(1);
    if (c.indexOf(name) === 0)
      return c.substring(name.length, c.length);
  }
  return "";
}