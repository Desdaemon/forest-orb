import { getDefaultUiTheme } from "./system";

let toastAnimEndTimer: number | undefined;

let fadetoastqueue = [];

export const notificationTypes = {
  system: [
    'siteUpdates',
    'error',
    'pushNotifications',
  ],
  account: [
    'loggedIn',
    'loggedOut',
    'passwordUpdate'
  ],
  players: [
    'playerBlocked',
    'playerUnblocked'
  ],
  friends: [
    'add',
    'remove',
    'accept',
    'reject',
    'cancel',
    'incoming',
    'playerOnline',
    'playerOffline'
  ],
  parties: [
    'create',
    'update',
    'join',
    'leave',
    'remove',
    'disband',
    'playerJoin',
    'playerLeave',
    'playerOnline',
    'playerOffline',
    'kickPlayer',
    'transferPartyOwner'
  ],
  events: [
    'complete',
    'freeComplete',
    'vmComplete',
    'listUpdated'
  ],
  badges: [
    'badgeUnlocked'
  ],
  timeTrials: [
    'goalReached'
  ],
  screenshots: [
    'screenshotTaken'
  ],
  saveSync: [
    'saveUploading',
    'saveUploaded',
    'saveDownloading',
    'saveDownloaded',
    'saveUpToDate',
    'saveCleared',
    'saveReminder'
  ],
  schedules: [
    'upcomingSchedules',
  ],
} as const;

type GeneratedConfig = {
    -readonly [T in keyof typeof notificationTypes]: { all: boolean; } & {
        [U in (typeof notificationTypes)[T][number]]?: boolean;
    };
};
type BaseConfig = { all: boolean; screenPosition: string; };

let notificationConfig: BaseConfig & Partial<GeneratedConfig> = {
  all: true,
  screenPosition: 'bottomLeft'
};

const accountNotificationCategories = [ 'account', 'events', 'badges', 'timeTrials', 'saveSync' ];

export function setNotificationScreenPosition(value) {
  if (value) {
    const toastContainer = document.getElementById('toastContainer');
    toastContainer.classList.toggle('top', value === 'topLeft' || value === 'topRight');
    toastContainer.classList.toggle('right', value === 'bottomRight' || value === 'topRight');
    document.getElementById('notificationScreenPosition').value = value;
    notificationConfig.screenPosition = value;
    updateConfig(notificationConfig, true, 'notificationConfig');
  }
}

/** A hook to allow postprocessing of notification config. */
function didSetNotificationConfig(category, type, value) {
  if (category === 'system' && type === 'pushNotifications') {
    navigator.serviceWorker.getRegistration('/').then(async registration => {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription && !value) {
        const endpoint = subscription.endpoint;
        if (await subscription.unsubscribe?.()) {
          apiJsonPost('unregisternotification', { endpoint })
            .then(response => {
              if (!response.ok)
                console.error(response.statusText);
            });
        }
      } else if (!subscription && value) {
        apiFetch('vapidpublickey')
          .then(r => r.text())
          .then(applicationServerKey => registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey }))
          .then(subscription => apiJsonPost('registernotification', subscription.toJSON()))
          .catch(err => console.error(err));
      }
    });
  }
}

export function showToastMessage(message, icon, iconFill, systemName, persist) {
  if (!notificationConfig.all)
    return;

  if (systemName) {
    if (gameUiThemes.indexOf(systemName) === -1)
      systemName = getDefaultUiTheme();
    systemName = systemName.replace(/ /g, '_')
  }
    
  const toast = document.createElement('div');
  toast.classList.add('toast');
  if (systemName)
    applyThemeStyles(toast, systemName);

  updateThemedContainer(toast);

  if (icon) {
    const toastIcon = getSvgIcon(icon, iconFill);
    toast.appendChild(toastIcon);
  }

  const toastMessageContainer = document.createElement('div');
  toastMessageContainer.classList.add('toastMessageContainer');

  const toastMessage = document.createElement('div');
  toastMessage.classList.add('toastMessage');

  toastMessage.innerHTML = message;

  toastMessageContainer.appendChild(toastMessage);
  toast.appendChild(toastMessageContainer);

  const closeButton = document.createElement('a');
  closeButton.classList.add('closeToast');
  closeButton.innerText = '✖';
  closeButton.href = 'javascript:void(0);';
  closeButton.ontouchstart = closeButton.onclick = () => toast.remove();

  toast.appendChild(closeButton);

  const toastContainer = document.getElementById('toastContainer');

  toastContainer.appendChild(toast);

  if (toastAnimEndTimer) {
    clearInterval(toastAnimEndTimer);
    toastContainer.classList.remove('anim');
  }

  const rootStyle = toastContainer.style;

  rootStyle.setProperty('--toast-offset', `-${toast.getBoundingClientRect().height + 8}px`);
  setTimeout(() => {
    toastContainer.classList.add('anim');
    rootStyle.setProperty('--toast-offset', '0');
    toastAnimEndTimer = setTimeout(() => {
      toastContainer.classList.remove('anim');
      toastAnimEndTimer = null;
      if (!persist) {
        const fadeToastFunc = () => {
          toast.classList.add('fade');
          setTimeout(() => toast.remove(), 1000);
        };
        if (document.hidden)
          fadeToastQueue.push(fadeToastFunc);
        else
          setTimeout(fadeToastFunc, 10000);
      }
    }, 500);
  }, 10);

  return toast;
}

// EXTERNAL
function showClientToastMessage(key, icon) {
  showSystemToastMessage(key, icon);
}

export function showSystemToastMessage(key, icon) {
  if (!notificationConfig.system.all || !notificationConfig.system[key] || document.querySelector(`.systemToast[data-notification-key='${key}']`))
    return;
  const toast = showToastMessage(getMassagedLabel(localizedMessages.toast.system[key], true), icon, true, null, true);
  toast.classList.add('systemToast');
  if (toast)
    toast.dataset.notificationKey = key;
}

// SIDE EFFECT
document.addEventListener('visibilitychange', () => {
  while (fadeToastQueue.length)
    setTimeout(fadeToastQueue.shift(), 10000);
});
