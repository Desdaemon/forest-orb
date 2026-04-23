import { showSystemToastMessage } from '$lib/components/ToastContainer.svelte';
import { isBrowser } from '$lib';

export const notificationTypes = {
	system: ['siteUpdates', 'error', 'pushNotifications'],
	account: ['loggedIn', 'loggedOut', 'passwordUpdate'],
	players: ['playerBlocked', 'playerUnblocked'],
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
	events: ['complete', 'freeComplete', 'vmComplete', 'listUpdated'],
	badges: ['badgeUnlocked'],
	timeTrials: ['goalReached'],
	screenshots: ['screenshotTaken'],
	saveSync: [
		'saveUploading',
		'saveUploaded',
		'saveDownloading',
		'saveDownloaded',
		'saveUpToDate',
		'saveCleared',
		'saveReminder'
	],
	schedules: ['upcomingSchedules']
} as const;

type GeneratedConfig = {
	-readonly [T in keyof typeof notificationTypes]: { all: boolean } & {
		[U in (typeof notificationTypes)[T][number]]?: boolean;
	};
};
type BaseConfig = { all: boolean; screenPosition: string };

export const notificationConfig: BaseConfig & GeneratedConfig = $state({
	all: true,
	screenPosition: 'bottomLeft'
} as any);

const accountNotificationCategories = ['account', 'events', 'badges', 'timeTrials', 'saveSync'];

export function initNotificationsConfigAndControls() {
	const notificationSettingsControls = document.querySelector(
		'#notificationSettingsModal .formControls'
	);

	for (let category of Object.keys(notificationTypes) as (keyof typeof notificationTypes)[]) {
		const categoryConfig = { all: true };
		notificationConfig[category] = categoryConfig;

		const accountRequired = accountNotificationCategories.indexOf(category) > -1;

		const categoryRow = document.createElement('li');
		categoryRow.classList.add('formControlRow');
		if (accountRequired) categoryRow.classList.add('accountRequired');

		const categoryButtonId = `notificationsButton_${category}`;

		const categoryLabel = document.createElement('label');
		categoryLabel.htmlFor = categoryButtonId;
		categoryLabel.classList.add('unselectable');
		categoryLabel.dataset.i18n = `[html]modal.notificationSettings.fields.${category}.label`;

		const categoryButtonContainer = document.createElement('div');

		const categoryButton = document.createElement('button');
		categoryButton.id = categoryButtonId;
		categoryButton.classList.add('checkboxButton', 'inverseToggle', 'unselectable');
		categoryButton.onclick = function () {
			const toggled = !this.classList.contains('toggled');
			this.classList.toggle('toggled', toggled);
			const typeRows = notificationSettingsControls.querySelectorAll(
				`.formControlRow[data-category="${category}"]`
			);
			for (let row of typeRows) row.classList.toggle('hidden', toggled);
			notificationConfig[category].all = !toggled;
			updateConfig(notificationConfig, true, 'notificationConfig');
		};

		categoryButton.appendChild(document.createElement('span'));

		categoryRow.appendChild(categoryLabel);

		categoryButtonContainer.appendChild(categoryButton);
		categoryRow.appendChild(categoryButtonContainer);

		notificationSettingsControls.appendChild(categoryRow);

		for (let type of notificationTypes[category]) {
			categoryConfig[type] = true;

			const typeRow = document.createElement('li');
			typeRow.classList.add('formControlRow', 'indent');
			if (accountRequired) typeRow.classList.add('accountRequired');
			typeRow.dataset.category = category;

			const typeButtonId = `${categoryButtonId}_${type}`;

			const typeLabel = document.createElement('label');
			typeLabel.classList.add('unselectable');
			typeLabel.htmlFor = typeButtonId;
			typeLabel.dataset.i18n = `[html]modal.notificationSettings.fields.${category}.fields.${type}`;

			const typeButtonContainer = document.createElement('div');

			const typeButton = document.createElement('button');
			typeButton.id = typeButtonId;
			typeButton.classList.add('checkboxButton', 'inverseToggle', 'unselectable');
			typeButton.onclick = function () {
				this.classList.toggle('toggled');
				notificationConfig[category][type] = !this.classList.contains('toggled');
				updateConfig(notificationConfig, true, 'notificationConfig');
				didSetNotificationConfig(category, type, notificationConfig[category][type]);
			};

			typeButton.appendChild(document.createElement('span'));

			typeRow.appendChild(typeLabel);

			typeButtonContainer.appendChild(typeButton);
			typeRow.appendChild(typeButtonContainer);

			notificationSettingsControls.appendChild(typeRow);
		}
	}

	document.getElementById('notificationsButton').onclick = function () {
		const toggled = !this.classList.contains('toggled');
		this.classList.toggle('toggled', toggled);
		document
			.getElementById('notificationSettingsModal')
			.classList.toggle('notificationsOff', toggled);
		notificationConfig.all = !toggled;
		updateConfig(notificationConfig, true, 'notificationConfig');
	};

	document.getElementById('notificationScreenPosition').onclick = function () {
		setNotificationScreenPosition(this.value);
	};
}

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
		navigator.serviceWorker.getRegistration('/').then(async (registration) => {
			const subscription = await registration.pushManager.getSubscription();
			if (subscription && !value) {
				const endpoint = subscription.endpoint;
				if (await subscription.unsubscribe?.()) {
					apiJsonPost('unregisternotification', { endpoint }).then((response) => {
						if (!response.ok) console.error(response.statusText);
					});
				}
			} else if (!subscription && value) {
				apiFetch('vapidpublickey')
					.then((r) => r.text())
					.then((applicationServerKey) =>
						registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
					)
					.then((subscription) => apiJsonPost('registernotification', subscription.toJSON()))
					.catch((err) => console.error(err));
			}
		});
	}
}

// EXTERNAL
if (isBrowser) {
	window.showClientToastMessage = showSystemToastMessage;
}
