import { filter, map, pipe } from 'rxjs';

export function dummyFn() {}

export function reduceToEmptyString() {
	return pipe(
		map((): '' => ''),
		filter((_, index) => !index)
	);
}

export function updateScroll(
	window: Window,
	scrollElement: HTMLElement,
	reverseLineOrder: boolean,
	displayVertical: boolean,
	behavior: ScrollBehavior = 'auto'
) {
	if (!scrollElement) {
		return;
	}

	setTimeout(() => {
		if (reverseLineOrder) {
			if (displayVertical) {
				scrollElement.scrollTo({ top: 0, left: scrollElement.scrollWidth, behavior });
			} else {
				window.scrollTo({ top: -scrollElement.scrollHeight, left: 0, behavior });
			}
		} else if (displayVertical) {
			scrollElement.scrollTo({ top: 0, left: -scrollElement.scrollWidth, behavior });
		} else {
			window.scrollTo({ top: scrollElement.scrollHeight + 100, left: 0, behavior });
		}
		if (behavior === 'smooth') {
			setTimeout(() => updateScroll(window, scrollElement, reverseLineOrder, displayVertical), 250);
		}
	});
}

export function toTimeString(s: number) {
	const hours = Math.floor(s / 3600);
	const minutes = Math.floor((s - hours * 3600) / 60);
	const seconds = s - hours * 3600 - minutes * 60;

	return `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`;
}

export function timeStringToSeconds(timeString: string) {
	const [hours, minutes, seconds] = timeString.split(':').map((part) => Number.parseInt(part, 10));

	return hours * 60 * 60 + minutes * 60 + seconds;
}

export function generateRandomUUID() {
	const bytes = new Uint8Array(16);

	crypto.getRandomValues(bytes);

	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	const uuid = Array.prototype.map
		.call(bytes, (b: number, i: number) => {
			return (b < 16 ? '0' : '') + b.toString(16) + (i % 2 && i < 10 && i > 2 ? '-' : '');
		})
		.join('');

	return uuid;
}

export const newLineCharacter = '\n';
