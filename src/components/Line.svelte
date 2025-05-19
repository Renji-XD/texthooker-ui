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
				paragraph.parentElement.parentElement,
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

	async function toggleCheckbox(id: string) {
		try {
			const res = await fetch('/update_checkbox', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
		} catch (error) {
			console.error('Error updating checkbox:', error);
		}
	}

	function buttonClick(id: string, action: string) {
		console.log(id);
		const endpoint = action === 'Screenshot' ? '/get-screenshot' : '/play-audio';
		fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id })
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				console.log(`${action} action completed for event ID: ${id}`, data);
			})
			.catch((error) => {
				console.error(`Error performing ${action} action for event ID: ${id}`, error);
			});
	}
</script>

{#key line.text}
	<div class="textline2">
		<input type="checkbox"
			   class="multi-line-checkbox"
			   id="multi-line-checkbox-{line.id}"
			   aria-label="{line.id}"
			   on:change={() => toggleCheckbox(line.id)}>
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
		<div class="textline-buttons">
			<button
				on:click={() => buttonClick(line.id, 'Screenshot')}
				title="Screenshot"
				style="background-color: #333; color: #fff; border: 1px solid #555; padding: 6px 10px; font-size: 10px; border-radius: 4px; cursor: pointer; transition: background-color 0.3s;"
			>
				&#x1F4F7;
			</button>
			<button
				on:click={() => buttonClick(line.id, 'Audio')}
				title="Audio"
				style="background-color: #333; color: #fff; border: 1px solid #555; padding: 6px 10px; font-size: 10px; border-radius: 4px; cursor: pointer; transition: background-color 0.3s;"
			>
				&#x1F50A;
			</button>
		</div>
	</div>
{/key}
{@html newLineCharacter}


<style>
	p:focus-visible {
		outline: none;
	}

	.multi-line-checkbox {
		transform: scale(1.5);
		margin-right: 10px;
		background-color: #00FFFF !important; /* Cyan/Electric Blue */
		border: 4px solid #00FFFF; /* Keep the border the same color */
	}

	.textline-buttons > button {
		background-color: #1a73e8;
		color: #ffffff;
		border: none;
		padding: 8px 15px;
		font-size: 14px;
		cursor: pointer;
		transition: background-color 0.3s;
		border-radius: 5px;
		user-select: none; /* Make text unselectable */
	}

	.textline-buttons > button:hover {
		background-color: #1669c1;
		cursor: pointer;
	}

	.textline-buttons {
		margin-left: auto; /* Align buttons to the right */
		display: flex;
		gap: 10px;
	}

	.textline2 {
		margin: 15px 0;
		padding: 15px;
		display: flex;
		align-items: center;
		gap: 15px;
	}
</style>
