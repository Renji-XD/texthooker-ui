<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { displayVertical$, enableLineAnimation$, preserveWhitespace$, reverseLineOrder$ } from '../stores/stores';
	import type { LineItem, LineItemEditEvent } from '../types';
	import { dummyFn, newLineCharacter, updateScroll } from '../util';

	export let line: LineItem;
	export let index: number;
	export let isLast: boolean;

	export function deselect() {
		isSelected = false;
	}

	export function getIdIfSelected(range: Range) {
		return isSelected || range.intersectsNode(paragraph) ? line.id : undefined;
	}

	const dispatch = createEventDispatcher<{ deselected: string; selected: string; edit: LineItemEditEvent }>();

	let paragraph: HTMLElement;
	let originalText = '';
	let isSelected = false;
	let isEditable = false;

	onMount(() => {
		if (isLast) {
			updateScroll(
				window,
				paragraph.parentElement,
				$reverseLineOrder$,
				$displayVertical$,
				$enableLineAnimation$ ? 'smooth' : 'auto'
			);
		}
	});

	onDestroy(() => {
		document.removeEventListener('click', clickOutsideHandler, false);
		dispatch('edit', { inEdit: false });
	});

	function handleDblClick(event: MouseEvent) {
		window.getSelection()?.removeAllRanges();

		if (event.ctrlKey || event.metaKey) {
			if (isSelected) {
				isSelected = false;
				dispatch('deselected', line.id);
			} else {
				isSelected = true;
				dispatch('selected', line.id);
			}
		} else {
			originalText = paragraph.innerText;
			isEditable = true;

			dispatch('edit', { inEdit: true });

			document.addEventListener('click', clickOutsideHandler, false);

			tick().then(() => {
				paragraph.focus();
			});
		}
	}

	function clickOutsideHandler(event: MouseEvent) {
		const target = event.target as Node;

		if (!paragraph.contains(target)) {
			isEditable = false;
			document.removeEventListener('click', clickOutsideHandler, false);

			dispatch('edit', {
				inEdit: false,
				data: { originalText, newText: paragraph.innerText, lineIndex: index, line },
			});
		}
	}
</script>

{#key line.text}
	<p
		class="my-2 cursor-pointer border-2"
		class:py-4={!$displayVertical$}
		class:px-2={!$displayVertical$}
		class:py-2={$displayVertical$}
		class:px-4={$displayVertical$}
		class:border-transparent={!isSelected}
		class:cursor-text={isEditable}
		class:border-primary={isSelected}
		class:border-accent-focus={isEditable}
		class:whitespace-pre-wrap={$preserveWhitespace$}
		contenteditable={isEditable}
		on:dblclick={handleDblClick}
		on:keyup={dummyFn}
		bind:this={paragraph}
		in:fly={{ x: $displayVertical$ ? 100 : -100, duration: $enableLineAnimation$ ? 250 : 0 }}
	>
		{line.text}
	</p>
{/key}
{@html newLineCharacter}

<style>
	p:focus-visible {
		outline: none;
	}
</style>
