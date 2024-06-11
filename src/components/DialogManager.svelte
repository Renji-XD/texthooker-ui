<script lang="ts">
	import { onDestroy } from 'svelte';
	import { dialogOpen$, openDialog$ } from '../stores/stores';
	import Dialog from './Dialog.svelte';
	import { maxDialogs$ } from '../stores/stores';

	let props: any;
	let dialogPropsQueue: any[] = [];

	const sub = openDialog$.subscribe((d) => {
		// -1 means no limit on the number of dialogs
		const dialogQueueIsFull = (dialogPropsQueue.length + (!props ? 0 : 1) + 1) > maxDialogs$._value && maxDialogs$._value !== -1;
		if (!d || dialogQueueIsFull) {
			return;
		}
		dialogPropsQueue.unshift(d);

		if (!props) {
			handleDialog();
		}
	});

	function handleDialog() {
		props = dialogPropsQueue.pop();

		$dialogOpen$ = !!props;
	}

	onDestroy(() => sub?.unsubscribe());
</script>

{#if props}
	<Dialog {...props} on:close={handleDialog} />
{/if}
