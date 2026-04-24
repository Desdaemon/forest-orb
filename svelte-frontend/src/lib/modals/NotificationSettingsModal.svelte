<script>
	import CheckboxButton from '$lib/components/CheckboxButton.svelte';
	import { notificationTypes, notificationConfig } from '$lib/toast.svelte';
	import { updateConfig } from '$lib/config.svelte';

	const accountNotificationCategories = ['account', 'events', 'badges', 'timeTrials', 'saveSync'];

	let notificationsOff = $state(false);

	function onClickCategory(category, toggled) {
		notificationConfig[category].all = toggled;
		updateConfig(notificationConfig, true, 'notificationConfig');
	}

	function onClickNotificationConfig(category, type, toggled) {
		notificationConfig[category][type] = toggled;
		updateConfig(notificationConfig, true, 'notificationConfig');
	}

	function onClickNotificationsButton(toggled) {
		notificationsOff = !toggled;
		notificationConfig.all = toggled;
		updateConfig(notificationConfig, true, 'notificationConfig');
	}

	function onChangeNotificationPosition({ currentTarget }) {
		notificationConfig.screenPosition = currentTarget.value;
		updateConfig(notificationConfig, true, 'notificationConfig');
	}
</script>

<div id="notificationSettingsModal" class={['modal', { notificationsOff }]}>
	<a href="javascript:void(0);" class="modalClose">✖</a>
	<div class="modalHeader">
		<h1 class="modalTitle" data-i18n="[html]modal.notificationSettings.title">
			Notification Settings
		</h1>
	</div>
	<div class="modalContent">
		<ul class="formControls">
			<li class="formControlRow">
				<label
					class="unselectable"
					data-i18n="[html]modal.notificationSettings.fields.toggleNotifications"
					>Notifications</label
				>
				<CheckboxButton toggled={notificationConfig.all} onclick={onClickNotificationsButton} />
			</li>
			<li class="formControlRow">
				<label
					for="notificationScreenPosition"
					class="unselectable"
					data-i18n="[html]modal.notificationSettings.fields.screenPosition.label">Screen Position</label
				>
				<div>
					<select id="notificationScreenPosition" size="4" value={notificationConfig.screenPosition} onchange={onChangeNotificationPosition}>
						<option
							value="bottomLeft"
							data-i18n="[html]modal.notificationSettings.fields.screenPosition.values.bottomLeft"
							>Bottom Left</option
						>
						<option
							value="bottomRight"
							data-i18n="[html]modal.notificationSettings.fields.screenPosition.values.bottomRight"
							>Bottom Right</option
						>
						<option
							value="topLeft"
							data-i18n="[html]modal.notificationSettings.fields.screenPosition.values.topLeft"
							>Top Left</option
						>
						<option
							value="topRight"
							data-i18n="[html]modal.notificationSettings.fields.screenPosition.values.topRight"
							>Top Right</option
						>
					</select>
				</div>
			</li>
			{#each Object.entries(notificationTypes) as [category, types] (category)}
				{@const accountRequired = accountNotificationCategories.includes(category)}
				{@const categoryId = `notificationsButton_${category}`}
				<li class={['formControlRow', { accountRequired }]}>
					<label
						for={categoryId}
						class="unselectable"
						data-i18n="[html]modal.notificationSettings.fields.{category}.label">{category}</label
					>
					<CheckboxButton
						toggled={notificationConfig[category].all}
						id={categoryId}
						onclick={(toggled) => onClickCategory(category, toggled)}
					/>
				</li>
				{#if notificationConfig[category].all}
					{#each types as type (`${category}__${type}`)}
						<li class={['formControlRow indent', { accountRequired }]}>
							<label
								for="{categoryId}_{type}"
								data-i18n="[html]modal.notificationSettings.fields.{category}.fields.{type}"
								>{category}:{type}</label
							>
							<CheckboxButton
								toggled={notificationConfig[category][type]}
								id="{categoryId}_{type}"
								onclick={(toggled) => onClickNotificationConfig(category, type, toggled)}
							/>
						</li>
					{/each}
				{/if}
			{/each}
		</ul>
	</div>
</div>
