<script lang="ts">
	import {
		mdiArrowULeftTop,
		mdiCancel,
		mdiCog,
		mdiDelete,
		mdiDeleteForever,
		mdiNoteEdit,
		mdiPause,
		mdiPlay
	} from '@mdi/js';
	import { filter, fromEvent, map, NEVER, switchMap, tap } from 'rxjs';
	import { onMount } from 'svelte';
	import { quintInOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import {
		actionHistory$,
		allowNewLineDuringPause$,
		autoStartTimerDuringPause$,
		dialogOpen$,
		displayVertical$,
		enablePaste$,
		flashOnMissedLine$,
		flashOnPauseTimeout$,
		fontSize$,
		isPaused$,
		lineData$,
		newLine$,
		notesOpen$,
		onlineFont$,
		preventGlobalDuplicate$,
		preventLastDuplicate$,
		removeAllWhitespace$,
		reverseLineOrder$,
		theme$,
		websocketUrl$
	} from '../stores/stores';
	import { OnlineFont, Theme, type LineItem } from '../types';
	import { generateRandomUUID, newLineCharacter, reduceToEmptyString, updateScroll } from '../util';
	import DialogManager from './DialogManager.svelte';
	import Icon from './Icon.svelte';
	import Line from './Line.svelte';
	import Notes from './Notes.svelte';
	import Settings from './Settings.svelte';
	import SocketConnector from './SocketConnector.svelte';
	import Stats from './Stats.svelte';

	let selectedLineIds: string[] = [];
	let settingsContainer: HTMLElement;
	let settingsElement: SVGElement;
	let settingsOpen = false;
	let lineContainer: HTMLElement;
	let lineElements: Line[] = [];
	let lineInEdit = false;
	let wakeLock = null;

	const wakeLockAvailable = 'wakeLock' in navigator;

	const uniqueLines$ = preventGlobalDuplicate$.pipe(
		map((preventGlobalDuplicate) =>
			preventGlobalDuplicate ? new Set($lineData$.map((line) => line.text)) : new Set()
		)
	);

	const handleLine$ = newLine$.pipe(
		filter(() => {
			const hasNoUserInteraction = !$notesOpen$ && !$dialogOpen$ && !settingsOpen && !lineInEdit;

			if ((!$isPaused$ || $allowNewLineDuringPause$ || $autoStartTimerDuringPause$) && hasNoUserInteraction) {
				if ($isPaused$ && $autoStartTimerDuringPause$) {
					$isPaused$ = false;
				}

				return true;
			}

			if (hasNoUserInteraction && $flashOnMissedLine$) {
				handleMissedLine();
			}

			return false;
		}),
		tap((newLine: string) => {
			const text = transformLine(newLine);

			if (text) {
				$lineData$ = [...$lineData$, { id: generateRandomUUID(), text }];
			}
		}),
		reduceToEmptyString()
	);

	const pastHandler$ = enablePaste$.pipe(
		switchMap((enablePaste) => (enablePaste ? fromEvent(document, 'paste') : NEVER)),
		tap((event: ClipboardEvent) => newLine$.next(event.clipboardData.getData('text/plain'))),
		reduceToEmptyString()
	);

	const visibilityHandler$ = fromEvent(document, 'visibilitychange').pipe(
		tap(() => {
			if (wakeLockAvailable && wakeLock !== null && document.visibilityState === 'visible') {
				wakeLock = navigator.wakeLock
					.request('screen')
					.then((lock) => {
						return lock;
					})
					.catch((error) => {
						console.error(`Unable to aquire screen lock: ${error.message}`);
						return null;
					});
			}
		}),
		reduceToEmptyString()
	);

	onMount(() => {
		executeUpdateScroll();

		if (wakeLockAvailable) {
			wakeLock = navigator.wakeLock
				.request('screen')
				.then((lock) => {
					return lock;
				})
				.catch((error) => {
					console.error(`Unable to aquire screen lock: ${error.message}`);
					return null;
				});
		}
	});

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Delete') {
			if (window.getSelection()?.toString().trim()) {
				const range = window.getSelection().getRangeAt(0);

				for (let index = 0, { length } = lineElements; index < length; index += 1) {
					const lineElement = lineElements[index];
					const selectedId = lineElement?.getIdIfSelected(range);

					if (selectedId) {
						selectedLineIds.push(selectedId);
					}
				}
			}

			if (selectedLineIds.length) {
				removeLines();
			}
		} else if (selectedLineIds.length && event.key === 'Escape') {
			deselectLines();
		}
	}

	function undoLastAction() {
		const linesToRevert = $actionHistory$.pop();

		let lineToRevert = linesToRevert.pop();

		while (lineToRevert) {
			const text = transformLine(lineToRevert.text);

			if (text) {
				const { id, index } = lineToRevert;

				if (index > $lineData$.length - 1) {
					$lineData$.push({ id, text });
				} else if ($lineData$[index].id === id) {
					$lineData$[index] = { id, text };
				} else {
					$lineData$.splice(index, 0, { id, text });
				}
			}

			lineToRevert = linesToRevert.pop();
		}

		$lineData$ = $lineData$;
		$actionHistory$ = $actionHistory$;
	}

	function removeLastLine() {
		const [removedLine] = $lineData$.splice($lineData$.length - 1, 1);

		selectedLineIds = selectedLineIds.filter((selectedLineId) => selectedLineId !== removedLine.id);

		$lineData$ = $lineData$;
		$actionHistory$ = [...$actionHistory$, [{ ...removedLine, index: $lineData$.length }]];
	}

	function removeLines() {
		const linesToDelete = new Set(selectedLineIds);
		const newActionHistory: LineItem[] = [];

		$lineData$ = $lineData$.filter((oldLine, index) => {
			const hasLine = linesToDelete.has(oldLine.id);

			linesToDelete.delete(oldLine.id);

			if (hasLine) {
				newActionHistory.push({ ...oldLine, index: index - newActionHistory.length });
			}

			return !hasLine;
		});

		selectedLineIds = linesToDelete.size ? [...linesToDelete] : [];

		if (newActionHistory.length) {
			$actionHistory$ = [...$actionHistory$, newActionHistory];
		}
	}

	function deselectLines() {
		for (let index = 0, { length } = lineElements; index < length; index += 1) {
			lineElements[index]?.deselect();
		}

		selectedLineIds = [];
	}

	function executeUpdateScroll() {
		updateScroll(window, lineContainer, $reverseLineOrder$, $displayVertical$);
	}

	function handleMissedLine() {
		clearTimeout($flashOnPauseTimeout$);

		if ($theme$ === Theme.GARDEN) {
			settingsContainer.classList.add('bg-base-200');
			settingsContainer.classList.remove('bg-base-100');
			document.body.classList.add('bg-base-200');
		}

		document.body.classList.add('animate-[pulse_0.5s_cubic-bezier(0.4,0,0.6,1)_1]');

		$flashOnPauseTimeout$ = window.setTimeout(() => {
			if ($theme$ === Theme.GARDEN) {
				settingsContainer.classList.add('bg-base-100');
				settingsContainer.classList.remove('bg-base-200');
				document.body.classList.remove('bg-base-200');
			}

			document.body.classList.remove('animate-[pulse_0.5s_cubic-bezier(0.4,0,0.6,1)_1]');
		}, 500);
	}

	function transformLine(text: string) {
		const lineToAppend = $removeAllWhitespace$ ? text.replace(/\s/gm, '').trim() : text;

		let canAppend = true;

		if (!lineToAppend) {
			canAppend = false;
		} else if ($preventGlobalDuplicate$) {
			canAppend = !$uniqueLines$.has(lineToAppend);
			$uniqueLines$.add(lineToAppend);
		} else if ($preventLastDuplicate$ && $lineData$.length) {
			canAppend = lineToAppend !== $lineData$[$lineData$.length - 1].text;
		}

		return canAppend ? lineToAppend : undefined;
	}
</script>

<svelte:window on:keyup={handleKeyPress} />

{$visibilityHandler$ ?? ''}
{$handleLine$ ?? ''}
{$pastHandler$ ?? ''}

<DialogManager />

<header class="fixed top-0 right-0 flex justify-end items-center p-2 bg-base-100" bind:this={settingsContainer}>
	<Stats />
	{#if $websocketUrl$}
		<SocketConnector />
	{/if}
	{#if $isPaused$}
		<div
			role="button"
			title="Continue"
			class="mr-2 animate-[pulse_1.25s_cubic-bezier(0.4,0,0.6,1)_infinite] hover:text-primary"
		>
			<Icon path={mdiPlay} on:click={() => ($isPaused$ = false)} />
		</div>
	{:else}
		<div role="button" title="Pause" class="mr-2 hover:text-primary">
			<Icon path={mdiPause} on:click={() => ($isPaused$ = true)} />
		</div>
	{/if}
	{#if $actionHistory$.length}
		<div role="button" title="Undo last Action" class="mr-2 hover:text-primary">
			<Icon path={mdiArrowULeftTop} on:click={undoLastAction} />
		</div>
	{/if}
	{#if $lineData$.length}
		<div role="button" title="Delete last Line" class="mr-2 hover:text-primary">
			<Icon path={mdiDeleteForever} on:click={removeLastLine} />
		</div>
	{/if}
	{#if selectedLineIds.length}
		<div role="button" title="Remove selected Lines" class="mr-2 hover:text-primary">
			<Icon path={mdiDelete} on:click={removeLines} />
		</div>
		<div role="button" title="Deselect Lines" class="mr-2 hover:text-primary">
			<Icon path={mdiCancel} on:click={deselectLines} />
		</div>
	{/if}
	<div role="button" title="Open Notes" class="mr-2 hover:text-primary">
		<Icon path={mdiNoteEdit} on:click={() => ($notesOpen$ = true)} />
	</div>
	<Icon
		path={mdiCog}
		class="cursor-pointer mr-2 hover:text-primary"
		bind:element={settingsElement}
		on:click={() => (settingsOpen = !settingsOpen)}
	/>
	<Settings {settingsElement} bind:settingsOpen bind:selectedLineIds on:layoutChange={executeUpdateScroll} />
</header>
<main
	class="flex flex-col flex-1 break-all px-4 w-full h-full overflow-auto"
	class:py-16={!$displayVertical$}
	class:py-8={$displayVertical$}
	class:opacity-50={$notesOpen$}
	class:flex-col-reverse={$reverseLineOrder$}
	style:font-size={`${$fontSize$}px`}
	style:font-family={$onlineFont$ !== OnlineFont.OFF ? $onlineFont$ : undefined}
	style:writing-mode={$displayVertical$ ? 'vertical-rl' : 'horizontal-tb'}
	bind:this={lineContainer}
>
	{@html newLineCharacter}
	{#each $lineData$ as line, index (line.id)}
		<Line
			{line}
			{index}
			isLast={$lineData$.length - 1 === index}
			bind:this={lineElements[index]}
			on:selected={({ detail }) => {
				selectedLineIds = [...selectedLineIds, detail];
			}}
			on:deselected={({ detail }) => {
				selectedLineIds = selectedLineIds.filter((selectedLineId) => selectedLineId !== detail);
			}}
			on:edit={({ detail }) => (lineInEdit = detail)}
		/>
	{/each}
</main>
{#if $notesOpen$}
	<div
		class="bg-base-200 fixed top-0 right-0 z-[60] flex h-full w-full max-w-3xl flex-col justify-between"
		in:fly|local={{ x: 100, duration: 100, easing: quintInOut }}
	>
		<Notes />
	</div>
{/if}
