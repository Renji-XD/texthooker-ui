export function clickOutside(node: Node, listener: (ev: MouseEvent) => void) {
	const handler = (ev: MouseEvent) => {
		if (!ev.defaultPrevented && !node.contains(ev.target as Node)) {
			listener(ev);
		}
	};

	document.addEventListener('click', handler, true);

	return {
		destroy() {
			document.removeEventListener('click', handler, true);
		},
	};
}
