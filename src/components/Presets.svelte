<script lang="ts">
	import { mdiContentSave, mdiDelete, mdiHelpCircle, mdiReload } from '@mdi/js';
	import { createEventDispatcher, tick } from 'svelte';
	import {
		adjustTimerOnAfk$,
		afkTimer$,
		maxLines$,
		allowNewLineDuringPause$,
		allowPasteDuringPause$,
		autoStartTimerDuringPause$,
		autoStartTimerDuringPausePaste$,
		blockCopyOnPage$,
		blurStats$,
		continuousReconnect$,
		customCSS$,
		defaultSettings,
		displayVertical$,
		enableExternalClipboardMonitor$,
		enableLineAnimation$,
		enablePaste$,
		flashOnMissedLine$,
		fontSize$,
		lastSettingPreset$,
		onlineFont$,
		openDialog$,
		persistActionHistory$,
		persistLines$,
		persistNotes$,
		persistStats$,
		preserveWhitespace$,
		preventGlobalDuplicate$,
		preventLastDuplicate$,
		reconnectSecondarySocket$,
		reconnectSocket$,
		removeAllWhitespace$,
		reverseLineOrder$,
		secondarySocketState$,
		secondaryWebsocketUrl$,
		settingPresets$,
		showCharacterCount$,
		showLineCount$,
		showPresetQuickSwitch$,
		showSpeed$,
		showTimer$,
		skipResetConfirmations$,
		socketState$,
		theme$,
		websocketUrl$,
		windowTitle$,
	} from '../stores/stores';
	import type { DialogResult, SettingPreset } from '../types';
	import { dummyFn } from '../util';
	import Icon from './Icon.svelte';

	export let isQuickSwitch = false;

	const fallbackPresetEntry = [{ name: '' }];
	const dispatch = createEventDispatcher<{ layoutChange: void }>();

	function selectPreset(event: Event) {
		const target = event.target as HTMLSelectElement;

		changePreset(target.selectedOptions[0].value);
	}

	function changePreset(presetName: string) {
		const existingEntry = $settingPresets$.find((entry) => entry.name === presetName);

		if (!existingEntry) {
			return;
		}

		theme$.next(existingEntry.settings.theme$ ?? defaultSettings.theme$);
		windowTitle$.next(existingEntry.settings.windowTitle$ ?? defaultSettings.windowTitle$);
		websocketUrl$.next(existingEntry.settings.websocketUrl$ ?? defaultSettings.websocketUrl$);
		secondaryWebsocketUrl$.next(existingEntry.settings.secondaryWebsocketUrl$ ?? '');
		fontSize$.next(existingEntry.settings.fontSize$ ?? defaultSettings.fontSize$);
		onlineFont$.next(existingEntry.settings.onlineFont$ ?? defaultSettings.onlineFont$);
		preventLastDuplicate$.next(
			existingEntry.settings.preventLastDuplicate$ ?? defaultSettings.preventLastDuplicate$,
		);
		afkTimer$.next(existingEntry.settings.afkTimer$ ?? defaultSettings.afkTimer$);
		maxLines$.next(existingEntry.settings.maxLines$ ?? defaultSettings.maxLines$);
		adjustTimerOnAfk$.next(existingEntry.settings.adjustTimerOnAfk$ ?? defaultSettings.adjustTimerOnAfk$);
		enableExternalClipboardMonitor$.next(
			existingEntry.settings.enableExternalClipboardMonitor$ ?? defaultSettings.enableExternalClipboardMonitor$,
		);
		showPresetQuickSwitch$.next(
			existingEntry.settings.showPresetQuickSwitch$ ?? defaultSettings.showPresetQuickSwitch$,
		);
		skipResetConfirmations$.next(
			existingEntry.settings.skipResetConfirmations$ ?? defaultSettings.skipResetConfirmations$,
		);
		persistStats$.next(existingEntry.settings.persistStats$ ?? defaultSettings.persistStats$);
		persistNotes$.next(existingEntry.settings.persistNotes$ ?? defaultSettings.persistNotes$);
		persistLines$.next(existingEntry.settings.persistLines$ ?? defaultSettings.persistLines$);
		persistActionHistory$.next(
			existingEntry.settings.persistActionHistory$ ?? defaultSettings.persistActionHistory$,
		);
		enablePaste$.next(existingEntry.settings.enablePaste$ ?? defaultSettings.enablePaste$);
		blockCopyOnPage$.next(existingEntry.settings.blockCopyOnPage$ ?? defaultSettings.blockCopyOnPage$);
		allowPasteDuringPause$.next(
			existingEntry.settings.allowPasteDuringPause$ ?? defaultSettings.allowPasteDuringPause$,
		);
		allowNewLineDuringPause$.next(
			existingEntry.settings.allowNewLineDuringPause$ ?? defaultSettings.allowNewLineDuringPause$,
		);
		autoStartTimerDuringPausePaste$.next(
			existingEntry.settings.autoStartTimerDuringPausePaste$ ?? defaultSettings.autoStartTimerDuringPausePaste$,
		);
		autoStartTimerDuringPause$.next(
			existingEntry.settings.autoStartTimerDuringPause$ ?? defaultSettings.autoStartTimerDuringPause$,
		);
		flashOnMissedLine$.next(existingEntry.settings.flashOnMissedLine$ ?? defaultSettings.flashOnMissedLine$);
		preventGlobalDuplicate$.next(
			existingEntry.settings.preventGlobalDuplicate$ ?? defaultSettings.preventGlobalDuplicate$,
		);
		displayVertical$.next(existingEntry.settings.displayVertical$ ?? defaultSettings.displayVertical$);
		reverseLineOrder$.next(existingEntry.settings.reverseLineOrder$ ?? defaultSettings.reverseLineOrder$);
		preserveWhitespace$.next(existingEntry.settings.preserveWhitespace$ ?? defaultSettings.preserveWhitespace$);
		removeAllWhitespace$.next(existingEntry.settings.removeAllWhitespace$ ?? defaultSettings.removeAllWhitespace$);
		showTimer$.next(existingEntry.settings.showTimer$ ?? defaultSettings.showTimer$);
		showSpeed$.next(existingEntry.settings.showSpeed$ ?? defaultSettings.showSpeed$);
		showCharacterCount$.next(existingEntry.settings.showCharacterCount$ ?? defaultSettings.showCharacterCount$);
		showLineCount$.next(existingEntry.settings.showLineCount$ ?? defaultSettings.showLineCount$);
		blurStats$.next(existingEntry.settings.blurStats$ ?? defaultSettings.blurStats$);
		enableLineAnimation$.next(existingEntry.settings.enableLineAnimation$ ?? defaultSettings.enableLineAnimation$);
		continuousReconnect$.next(existingEntry.settings.continuousReconnect$ ?? defaultSettings.continuousReconnect$);
		customCSS$.next(existingEntry.settings.customCSS$ ?? defaultSettings.customCSS$);

		$lastSettingPreset$ = presetName;

		tick().then(() => {
			dispatch('layoutChange');

			if ($socketState$ !== 1 && $continuousReconnect$) {
				reconnectSocket$.next();
			}

			if ($secondarySocketState$ !== 1 && $continuousReconnect$) {
				reconnectSecondarySocket$.next();
			}
		});
	}

	async function savePreset() {
		const { canceled, data } = await new Promise<DialogResult<string>>((resolve) => {
			$openDialog$ = {
				icon: mdiHelpCircle,
				askForData: 'text',
				dataValue: $lastSettingPreset$ || 'Preset Name',
				message: '',
				callback: resolve,
			};
		});

		if (canceled || !data) {
			return;
		}

		const existingEntryIndex = $settingPresets$.findIndex((entry) => entry.name === data);
		const entry: SettingPreset = {
			name: data,
			settings: {
				theme$: $theme$,
				windowTitle$: $windowTitle$,
				websocketUrl$: $websocketUrl$,
				secondaryWebsocketUrl$: $secondaryWebsocketUrl$,
				fontSize$: $fontSize$,
				onlineFont$: $onlineFont$,
				preventLastDuplicate$: $preventLastDuplicate$,
				afkTimer$: $afkTimer$,
				maxLines$: $maxLines$,
				adjustTimerOnAfk$: $adjustTimerOnAfk$,
				enableExternalClipboardMonitor$: $enableExternalClipboardMonitor$,
				showPresetQuickSwitch$: $showPresetQuickSwitch$,
				skipResetConfirmations$: $skipResetConfirmations$,
				persistStats$: $persistStats$,
				persistNotes$: $persistNotes$,
				persistLines$: $persistLines$,
				persistActionHistory$: $persistActionHistory$,
				enablePaste$: $enablePaste$,
				blockCopyOnPage$: $blockCopyOnPage$,
				allowPasteDuringPause$: $allowPasteDuringPause$,
				allowNewLineDuringPause$: $allowNewLineDuringPause$,
				autoStartTimerDuringPausePaste$: $autoStartTimerDuringPausePaste$,
				autoStartTimerDuringPause$: $autoStartTimerDuringPause$,
				flashOnMissedLine$: $flashOnMissedLine$,
				preventGlobalDuplicate$: $preventGlobalDuplicate$,
				displayVertical$: $displayVertical$,
				reverseLineOrder$: $reverseLineOrder$,
				preserveWhitespace$: $preserveWhitespace$,
				removeAllWhitespace$: $removeAllWhitespace$,
				showTimer$: $showTimer$,
				showSpeed$: $showSpeed$,
				showCharacterCount$: $showCharacterCount$,
				showLineCount$: $showLineCount$,
				blurStats$: $blurStats$,
				enableLineAnimation$: $enableLineAnimation$,
				continuousReconnect$: $continuousReconnect$,
				customCSS$: $customCSS$,
			},
		};

		if (existingEntryIndex > -1) {
			$settingPresets$[existingEntryIndex] = entry;
		} else {
			$settingPresets$ = [...$settingPresets$, entry];
		}

		$lastSettingPreset$ = data;
	}

	async function deletePreset() {
		if (!$skipResetConfirmations$) {
			const { canceled } = await new Promise<DialogResult>((resolve) => {
				$openDialog$ = {
					icon: mdiHelpCircle,
					message: 'Preset will be deleted',
					callback: resolve,
				};
			});

			if (canceled) {
				return;
			}
		}

		$settingPresets$ = $settingPresets$.filter((entry) => entry.name !== $lastSettingPreset$);
		$lastSettingPreset$ = '';
	}
</script>

{#if isQuickSwitch}
	<select
		class="w-48 hidden sm:block"
		class:sm:hidden={!$showPresetQuickSwitch$ || $settingPresets$.length < 2}
		value={$lastSettingPreset$}
		on:change={selectPreset}
	>
		{#each $settingPresets$.length ? $settingPresets$ : fallbackPresetEntry as preset (preset.name)}
			<option value={preset.name}>
				{preset.name}
			</option>
		{/each}
	</select>
{:else}
	<details role="button" class="col-span-4 mb-2">
		<summary>Presets</summary>
		<div class="flex items-center mt-2">
			<select class="select flex-1 max-w-md" value={$lastSettingPreset$} on:change={selectPreset}>
				{#each $settingPresets$.length ? $settingPresets$ : fallbackPresetEntry as preset (preset.name)}
					<option value={preset.name}>
						{preset.name || 'No Presets stored'}
					</option>
				{/each}
			</select>
			<div
				role="button"
				class="flex flex-col items-center hover:text-primary ml-3"
				on:click={savePreset}
				on:keyup={dummyFn}
			>
				<Icon path={mdiContentSave} />
				<span class="label-text">Save</span>
			</div>
			<div
				role="button"
				class="flex flex-col items-center hover:text-primary ml-3"
				class:invisible={!$lastSettingPreset$}
				on:click={() => changePreset($lastSettingPreset$)}
				on:keyup={dummyFn}
			>
				<Icon path={mdiReload} />
				<span class="label-text">Reload</span>
			</div>
			<div
				role="button"
				class="flex flex-col items-center hover:text-primary ml-3"
				class:invisible={!$lastSettingPreset$}
				on:click={deletePreset}
				on:keyup={dummyFn}
			>
				<Icon path={mdiDelete} />
				<span class="label-text">Delete</span>
			</div>
		</div>
	</details>
{/if}
