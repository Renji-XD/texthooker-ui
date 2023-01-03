<script lang="ts">
	import {
		mdiClose,
		mdiDatabaseSync,
		mdiDelete,
		mdiHelpCircle,
		mdiTimerCancel,
		mdiTimerEdit,
		mdiWeatherNight,
		mdiWhiteBalanceSunny
	} from '@mdi/js';
	import { createEventDispatcher, tick } from 'svelte';
	import {
		actionHistory$,
		adjustTimerOnAfk$,
		afkTimer$,
		allowNewLineDuringPause$,
		autoStartTimerDuringPause$,
		blurStats$,
		customCSS$,
		dialogOpen$,
		displayVertical$,
		enableExternalClipboardMonitor$,
		enablePaste$,
		flashOnMissedLine$,
		fontSize$,
		lineData$,
		newLine$,
		onlineFont$,
		openDialog$,
		persistActionHistory$,
		persistLines$,
		persistNotes$,
		persistStats$,
		preserveWhitespace$,
		preventGlobalDuplicate$,
		preventLastDuplicate$,
		removeAllWhitespace$,
		resetAllData,
		reverseLineOrder$,
		showCharacterCount$,
		showLineCount$,
		showSpeed$,
		showTimer$,
		theme$,
		timeValue$,
		userNotes$,
		websocketUrl$,
		windowTitle$
	} from '../stores/stores';
	import { OnlineFont, Theme, type DialogResult } from '../types';
	import { clickOutside } from '../use-click-outside';
	import { dummyFn, timeStringToSeconds } from '../util';
	import Icon from './Icon.svelte';

	export let selectedLineIds: string[];
	export let settingsOpen: boolean;
	export let settingsElement: SVGElement;

	let fileInput: HTMLInputElement;
	let clipboardMutationObserver: MutationObserver | undefined;

	const dispatch = createEventDispatcher<{ layoutChange: void }>();

	const onlineFonts = [OnlineFont.OFF, OnlineFont.NOTO, OnlineFont.KLEE, OnlineFont.SHIPPORI];

	$: document.body.dataset.theme = $theme$;

	$: updateExternalClipboardMonitor($enableExternalClipboardMonitor$);

	$: updateCustomCSS($customCSS$);

	function updateExternalClipboardMonitor(enableExternalClipboardMonitor: boolean) {
		if (enableExternalClipboardMonitor && !clipboardMutationObserver) {
			tick().then(() => {
				clipboardMutationObserver = new MutationObserver(clipboardMutationObserverCallback);
				clipboardMutationObserver.observe(document.body, { childList: true });
			});
		} else if (!enableExternalClipboardMonitor && clipboardMutationObserver) {
			clipboardMutationObserver.disconnect();
			clipboardMutationObserver = undefined;
		}
	}

	function clipboardMutationObserverCallback(mutations: MutationRecord[]) {
		for (let index = 0, { length } = mutations; index < length; index += 1) {
			const { addedNodes } = mutations[index];

			for (let index2 = 0, { length: length2 } = addedNodes; index2 < length2; index2 += 1) {
				const addedNode = addedNodes[index] as HTMLElement;

				if (addedNode.tagName === 'P') {
					newLine$.next(addedNode.textContent);
					addedNode.remove();
				}
			}
		}
	}

	function updateCustomCSS(customCSS: string) {
		const textNode = document.createTextNode(customCSS);

		let styleElement = document.getElementById('user-css');

		if (styleElement) {
			styleElement.replaceChild(textNode, styleElement.firstChild);
		} else {
			styleElement = document.createElement('style');
			styleElement.id = 'user-css';

			styleElement.appendChild(textNode);
			document.head.append(styleElement);
		}
	}

	function handleSettingsClick(event: MouseEvent) {
		const target = event.target as any;

		if (
			target !== settingsElement &&
			target.parentElement !== settingsElement &&
			target !== fileInput &&
			!$dialogOpen$
		) {
			settingsOpen = false;
		}
	}

	async function handleSetTimer() {
		const { canceled, data } = await new Promise<DialogResult<string>>((resolve) => {
			$openDialog$ = {
				icon: mdiHelpCircle,
				askForData: 'text',
				dataValue: '00:00:00',
				message: 'New Time',
				callback: resolve,
			};
		});

		if (canceled) {
			return;
		}

		if (!/^[\d]{1,}:[\d]{1,2}:[\d]{1,2}$/.test(data)) {
			return new Promise<DialogResult<string>>((resolve) => {
				$openDialog$ = {
					icon: mdiClose,
					type: 'error',
					message: 'Invalid Time value (x:xx:xx)',
					showCancel: false,
					callback: resolve,
				};
			});
		}

		$timeValue$ = timeStringToSeconds(data);
	}

	async function handleResetTimer() {
		const { canceled } = await new Promise<DialogResult>((resolve) => {
			$openDialog$ = {
				icon: mdiHelpCircle,
				message: 'Timer will be set to 00:00:00',
				callback: resolve,
			};
		});

		if (!canceled) {
			$timeValue$ = 0;
		}
	}

	async function handleReset(linesOnly: boolean) {
		const { canceled } = await new Promise<DialogResult>((resolve) => {
			$openDialog$ = {
				icon: mdiHelpCircle,
				message: linesOnly
					? 'All displayed and stored Lines will be cleared'
					: 'Clear stored Lines + set Timer to 00:00:00',
				callback: resolve,
			};
		});

		if (canceled) {
			return;
		}

		$lineData$ = [];
		selectedLineIds = [];
		window.localStorage.removeItem('bannou-texthooker-lineData');

		if (!linesOnly) {
			$timeValue$ = 0;
		}
	}

	async function handleExportImportData(event: MouseEvent) {
		if (event.altKey) {
			const { canceled } = await new Promise<DialogResult>((resolve) => {
				$openDialog$ = {
					icon: mdiHelpCircle,
					message: 'Existing Data will be overwritten',
					callback: resolve,
				};
			});

			if (!canceled) {
				fileInput.click();
			}
		} else {
			const a = document.createElement('a');
			a.href = URL.createObjectURL(
				new Blob(
					[
						JSON.stringify({
							'bannou-texthooker-timeValue': $timeValue$,
							'bannou-texthooker-userNotes': $userNotes$,
							'bannou-texthooker-lineData': $lineData$,
							'bannou-texthooker-actionHistory': $actionHistory$,
						}),
					],
					{ type: `application/json` }
				)
			);
			a.rel = 'noopener';
			a.download = 'texthooker-ui.json';
			setTimeout(() => {
				URL.revokeObjectURL(a.href);
			}, 1e4);

			setTimeout(() => {
				a.click();
			});
		}
	}

	async function handleFileChange() {
		const [file] = fileInput.files;

		if (!file) {
			return;
		}

		if (!file.name.endsWith('.json')) {
			$openDialog$ = {
				type: 'error',
				message: `Expected json File`,
				showCancel: false,
			};

			fileInput.value = null;
			return;
		}

		const data = await loadFile(file).catch(({ message }) => {
			$openDialog$ = {
				type: 'error',
				message,
				showCancel: false,
			};
			return undefined;
		});

		if (data) {
			const entries = Object.entries(data);

			for (let index = 0, { length } = entries; index < length; index += 1) {
				const [key, value] = entries[index];

				switch (key) {
					case 'bannou-texthooker-timeValue':
						$timeValue$ = value;
						break;
					case 'bannou-texthooker-userNotes':
						$userNotes$ = value;
						break;
					case 'bannou-texthooker-lineData':
						$lineData$ = value;
						break;
					case 'bannou-texthooker-actionHistory':
						$actionHistory$ = value;
						break;
					default:
						break;
				}
			}
		}

		fileInput.value = null;
	}

	function loadFile(file: File) {
		return new Promise((resolve, reject) => {
			const fileReader = new FileReader();

			fileReader.addEventListener('loadend', (event) => {
				try {
					const data = JSON.parse(event.target.result as string);
					resolve(data);
				} catch (error) {
					reject(new Error('Error parsing File'));
				}
			});
			fileReader.addEventListener('error', () => reject(new Error('Failed to read File')));
			fileReader.readAsText(file, 'utf-8');
		});
	}

	async function handlePersistenceChange(settingEnabled: boolean, message: String, storageKey: string) {
		if (settingEnabled) {
			return;
		}

		const { canceled } = await new Promise<DialogResult>((resolve) => {
			$openDialog$ = {
				icon: mdiHelpCircle,
				message,
				callback: resolve,
			};
		});

		if (!canceled) {
			window.localStorage.removeItem(storageKey);
		}
	}

	async function handlePreventLastDuplicateChange() {
		if (!$preventLastDuplicate$ || $lineData$.length < 2) {
			return;
		}

		const { canceled } = await new Promise<DialogResult>((resolve) => {
			$openDialog$ = {
				icon: mdiHelpCircle,
				message: 'Apply to current lines',
				callback: resolve,
			};
		});

		if (!canceled && $lineData$[$lineData$.length - 1].text === $lineData$[$lineData$.length - 2].text) {
			const [removedLine] = $lineData$.splice($lineData$.length - 1, 1);

			$lineData$ = $lineData$;
			selectedLineIds = selectedLineIds.filter((selectedLineId) => selectedLineId !== removedLine.id);
		}
	}

	async function handlePreventGlobalDuplicateChange() {
		if (!$preventGlobalDuplicate$ || $lineData$.length < 2) {
			return;
		}

		const { canceled } = await new Promise<DialogResult>((resolve) => {
			$openDialog$ = {
				icon: mdiHelpCircle,
				message: 'Apply to current lines',
				callback: resolve,
			};
		});

		if (!canceled) {
			const uniqueLines = new Set<string>();
			const removedLineIds = new Set<string>();

			$lineData$ = $lineData$.filter((line) => {
				if (uniqueLines.has(line.text)) {
					removedLineIds.add(line.id);
					return false;
				}

				uniqueLines.add(line.text);
				return true;
			});
			selectedLineIds = selectedLineIds.filter((selectedLineId) => !removedLineIds.has(selectedLineId));
		}
	}

	async function handleRemoveAllWhiteSpaceChange() {
		if ($removeAllWhitespace$) {
			const { canceled } = await new Promise<DialogResult>((resolve) => {
				$openDialog$ = {
					icon: mdiHelpCircle,
					message: 'Apply to current Lines',
					callback: resolve,
				};
			});

			if (!canceled) {
				$lineData$ = $lineData$.map((oldLine) => {
					oldLine.text = oldLine.text.replace(/\s/g, '').trim();
					return oldLine;
				});
			}
		}
	}

	function handleCustomCSSBlur(event: FocusEvent) {
		$customCSS$ = (event.target as HTMLTextAreaElement).value;
	}
</script>

<svelte:head>
	<title>{$windowTitle$ || 'Texthooker UI'}</title>
</svelte:head>

{#if settingsOpen}
	<input class="hidden" type="file" bind:this={fileInput} on:change={handleFileChange} />
	<div
		class="grid grid-cols-[max-content,auto,max-content,auto] gap-3 absolute overflow-auto h-[90vh] top-11 z-10 py-4 pr-8 pl-4 border bg-base-200"
		use:clickOutside={handleSettingsClick}
	>
		<div class="mb-2" style="grid-column: 1/5;">
			<div class="flex justify-between text-sm">
				<div
					role="button"
					class="flex flex-col items-center hover:text-primary"
					on:click={handleSetTimer}
					on:keyup={dummyFn}
				>
					<Icon path={mdiTimerEdit} />
					<span class="label-text">Set Timer</span>
				</div>
				<div
					role="button"
					class="flex flex-col items-center hover:text-primary"
					on:click={handleResetTimer}
					on:keyup={dummyFn}
				>
					<Icon path={mdiTimerCancel} />
					<span class="label-text">Reset Timer</span>
				</div>
				<div
					role="button"
					class="flex flex-col items-center hover:text-primary"
					on:click={() => handleReset(true)}
					on:keyup={dummyFn}
				>
					<Icon path={mdiDelete} />
					<span class="label-text">Reset Lines</span>
				</div>
				<div
					role="button"
					class="flex flex-col items-center hover:text-primary"
					on:click={() => handleReset(false)}
					on:keyup={dummyFn}
				>
					<Icon path={mdiDelete} />
					<span class="label-text">Reset Data</span>
				</div>
				<div
					role="button"
					class="flex flex-col items-center hover:text-primary"
					on:click={resetAllData}
					on:keyup={dummyFn}
				>
					<Icon path={mdiDelete} />
					<span class="label-text">Reset All</span>
				</div>
				<div
					role="button"
					class="flex flex-col items-center hover:text-primary"
					on:click={handleExportImportData}
					on:keyup={dummyFn}
				>
					<Icon path={mdiDatabaseSync} />
					<span class="label-text">Ex-/Import Data</span>
				</div>
				<div
					role="button"
					class="flex flex-col items-center hover:text-primary"
					on:click={() => ($theme$ = $theme$ === Theme.BUSINESS ? Theme.GARDEN : Theme.BUSINESS)}
					on:keyup={dummyFn}
				>
					<label class="swap swap-rotate">
						<input
							type="checkbox"
							checked={$theme$ === Theme.BUSINESS}
							on:change={() => ($theme$ = $theme$ === Theme.BUSINESS ? Theme.GARDEN : Theme.BUSINESS)}
						/>
						<Icon class="swap-on" path={mdiWeatherNight} />
						<Icon class="swap-off" path={mdiWhiteBalanceSunny} />
					</label>
					<span class="label-text">Theme</span>
				</div>
			</div>
		</div>
		<span class="label-text">Window Title</span>
		<input class="input input-bordered h-8 ml-2" bind:value={$windowTitle$} />
		<span class="label-text">Websocket</span>
		<input class="input input-bordered h-8 ml-2" bind:value={$websocketUrl$} />
		<span class="label-text">Font Size</span>
		<input
			type="number"
			class="input input-bordered h-8 ml-2"
			min="1"
			bind:value={$fontSize$}
			on:blur={() => {
				if (!$fontSize$ || $fontSize$ < 1) {
					$fontSize$ = 24;
				}
			}}
		/>
		<span class="label-text mr-4">Online Font</span>
		<select class="select ml-2" bind:value={$onlineFont$}>
			{#each onlineFonts as font (font)}
				<option value={font}>
					{font}
				</option>
			{/each}
		</select>
		<span class="label-text">AFK Timer (s)</span>
		<input
			type="number"
			class="input input-bordered h-8 ml-2"
			min="0"
			bind:value={$afkTimer$}
			on:blur={() => {
				if ($afkTimer$ === null || $afkTimer$ < 0) {
					$afkTimer$ = 0;
				}
			}}
		/>
		<div style="grid-column: 3/5;" />
		<span class="label-text">Adjust Timer after AFK</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$adjustTimerOnAfk$} />
		<span class="label-text">Enable external Clipboard Monitor</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$enableExternalClipboardMonitor$} />
		<span class="label-text">Store Stats persistently</span>
		<input
			type="checkbox"
			class="checkbox checkbox-primary ml-2"
			bind:checked={$persistStats$}
			on:change={() =>
				handlePersistenceChange($persistStats$, 'Clear stored stats', 'bannou-texthooker-timeValue')}
		/>
		<span class="label-text">Store Notes persistently</span>
		<input
			type="checkbox"
			class="checkbox checkbox-primary ml-2"
			bind:checked={$persistNotes$}
			on:change={() =>
				handlePersistenceChange($persistNotes$, 'Clear stored notes', 'bannou-texthooker-userNotes')}
		/>
		<span class="label-text">Store Lines persistently</span>
		<input
			type="checkbox"
			class="checkbox checkbox-primary ml-2"
			bind:checked={$persistLines$}
			on:change={() =>
				handlePersistenceChange($persistLines$, 'Clear stored lines', 'bannou-texthooker-lineData')}
		/>
		<span class="label-text">Store Action History persistently</span>
		<input
			type="checkbox"
			class="checkbox checkbox-primary ml-2"
			bind:checked={$persistActionHistory$}
			on:change={() =>
				handlePersistenceChange(
					$persistActionHistory$,
					'Clear action history',
					'bannou-texthooker-actionHistory'
				)}
		/>
		<span class="label-text">Enable Paste</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$enablePaste$} />
		<span class="label-text">Flash on missed Line</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$flashOnMissedLine$} />
		<span class="label-text">Allow new Line during Pause</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$allowNewLineDuringPause$} />
		<span class="label-text">Autostart Timer during Pause</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$autoStartTimerDuringPause$} />
		<span class="label-text">Prevent Last Line Duplicate</span>
		<input
			type="checkbox"
			class="checkbox checkbox-primary ml-2"
			bind:checked={$preventLastDuplicate$}
			on:change={handlePreventLastDuplicateChange}
		/>
		<span class="label-text">Prevent Global Duplicate</span>
		<input
			type="checkbox"
			class="checkbox checkbox-primary ml-2"
			bind:checked={$preventGlobalDuplicate$}
			on:change={handlePreventGlobalDuplicateChange}
		/>
		<span class="label-text">Display Text vertically</span>
		<input
			type="checkbox"
			class="checkbox checkbox-primary ml-2"
			bind:checked={$displayVertical$}
			on:change={() => dispatch('layoutChange')}
		/>
		<span class="label-text">Reverse Line Order</span>
		<input
			type="checkbox"
			class="checkbox checkbox-primary ml-2"
			bind:checked={$reverseLineOrder$}
			on:change={() => dispatch('layoutChange')}
		/>
		<span class="label-text">Preserve Whitespace</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$preserveWhitespace$} />
		<span class="label-text">Remove all Whitespace</span>
		<input
			type="checkbox"
			class="checkbox checkbox-primary ml-2"
			bind:checked={$removeAllWhitespace$}
			on:change={handleRemoveAllWhiteSpaceChange}
		/>
		<span class="label-text">Show Timer</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$showTimer$} />
		<span class="label-text">Show Speed</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$showSpeed$} />
		<span class="label-text">Show Character Count</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$showCharacterCount$} />
		<span class="label-text">Show Line Count</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$showLineCount$} />
		<span class="label-text">Blur Stats</span>
		<input type="checkbox" class="checkbox checkbox-primary ml-2" bind:checked={$blurStats$} />
		<span class="label-text" style="grid-column: 1/5;">Custom CSS</span>
		<textarea
			class="p-1 min-h-[10rem]"
			style="grid-column: 1/5;"
			rows="5"
			value={$customCSS$}
			on:blur={handleCustomCSSBlur}
		/>
	</div>
{/if}