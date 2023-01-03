import { OnlineFont, Theme, type DialogResult, type LineItem } from './../types';

import { mdiHelpCircle } from '@mdi/js';
import { Subject } from 'rxjs';
import { writable } from 'svelte/store';
import { writableBooleanSubject } from './transformer/writeable-boolean-subject';
import { writableNumberSubject } from './transformer/writeable-number-subject';
import { writeableArraySubject } from './transformer/writeable-object-sibject';
import { writableStringSubject } from './transformer/writeable-string-subject';
import { writableSubject } from './transformer/writeable-subject';

const defaultSettings = {
	theme$: Theme.BUSINESS,
	windowTitle$: '',
	websocketUrl$: 'ws://localhost:6677',
	fontSize$: 24,
	onlineFont$: OnlineFont.OFF,
	afkTimer$: 0,
	adjustTimerOnAfk$: false,
	enableExternalClipboardMonitor$: false,
	persistStats$: true,
	persistNotes$: true,
	persistLines$: true,
	persistActionHistory$: false,
	enablePaste$: false,
	flashOnMissedLine$: true,
	allowNewLineDuringPause$: false,
	autoStartTimerDuringPause$: false,
	preventLastDuplicate$: false,
	preventGlobalDuplicate$: false,
	displayVertical$: false,
	reverseLineOrder$: false,
	preserveWhitespace$: true,
	removeAllWhitespace$: false,
	showTimer$: true,
	showSpeed$: true,
	showCharacterCount$: true,
	showLineCount$: true,
	blurStats$: false,
	customCSS$: '',
};

export const theme$ = writableStringSubject()('bannou-texthooker-theme', defaultSettings.theme$);

export const windowTitle$ = writableStringSubject()('bannou-texthooker-windowTitle', defaultSettings.windowTitle$);

export const websocketUrl$ = writableStringSubject()('bannou-texthooker-websocketUrl', defaultSettings.websocketUrl$);

export const fontSize$ = writableNumberSubject()('bannou-texthooker-fontSize', defaultSettings.fontSize$);

export const onlineFont$ = writableStringSubject()('bannou-texthooker-onlineFont', defaultSettings.onlineFont$);

export const afkTimer$ = writableNumberSubject()('bannou-texthooker-afkTimer', defaultSettings.afkTimer$);

export const adjustTimerOnAfk$ = writableBooleanSubject()(
	'bannou-texthooker-adjustTimerOnAfk',
	defaultSettings.adjustTimerOnAfk$
);

export const enableExternalClipboardMonitor$ = writableBooleanSubject()(
	'bannou-texthooker-enableExternalClipboardMonitor',
	defaultSettings.enableExternalClipboardMonitor$
);

export const persistStats$ = writableBooleanSubject()('bannou-texthooker-persistStats', defaultSettings.persistStats$);

export const persistNotes$ = writableBooleanSubject()('bannou-texthooker-persistNotes', defaultSettings.persistNotes$);

export const persistLines$ = writableBooleanSubject()('bannou-texthooker-persistLines', defaultSettings.persistLines$);

export const persistActionHistory$ = writableBooleanSubject()(
	'bannou-texthooker-persistActionHistory',
	defaultSettings.persistActionHistory$
);

export const enablePaste$ = writableBooleanSubject()('bannou-texthooker-enablePaste', defaultSettings.enablePaste$);

export const flashOnMissedLine$ = writableBooleanSubject()(
	'bannou-texthooker-flashOnMissedLine',
	defaultSettings.flashOnMissedLine$
);

export const allowNewLineDuringPause$ = writableBooleanSubject()(
	'bannou-texthooker-allowNewLineDuringPause',
	defaultSettings.allowNewLineDuringPause$
);

export const autoStartTimerDuringPause$ = writableBooleanSubject()(
	'bannou-texthooker-autoStartTimerDuringPause',
	defaultSettings.autoStartTimerDuringPause$
);

export const preventLastDuplicate$ = writableBooleanSubject()(
	'bannou-texthooker-preventLastDuplicate',
	defaultSettings.preventLastDuplicate$
);

export const preventGlobalDuplicate$ = writableBooleanSubject()(
	'bannou-texthooker-preventGlobalDuplicate',
	defaultSettings.preventGlobalDuplicate$
);

export const displayVertical$ = writableBooleanSubject()(
	'bannou-texthooker-displayVertical',
	defaultSettings.displayVertical$
);

export const reverseLineOrder$ = writableBooleanSubject()(
	'bannou-texthooker-reverseLineOrder',
	defaultSettings.reverseLineOrder$
);

export const preserveWhitespace$ = writableBooleanSubject()(
	'bannou-texthooker-preserveWhitespace',
	defaultSettings.preserveWhitespace$
);

export const removeAllWhitespace$ = writableBooleanSubject()(
	'bannou-texthooker-removeAllWhitespace',
	defaultSettings.removeAllWhitespace$
);

export const showTimer$ = writableBooleanSubject()('bannou-texthooker-showTimer', defaultSettings.showTimer$);

export const showSpeed$ = writableBooleanSubject()('bannou-texthooker-showSpeed', defaultSettings.showSpeed$);

export const showCharacterCount$ = writableBooleanSubject()(
	'bannou-texthooker-showCharacterCount',
	defaultSettings.showCharacterCount$
);

export const showLineCount$ = writableBooleanSubject()(
	'bannou-texthooker-showLineCount',
	defaultSettings.showLineCount$
);

export const blurStats$ = writableBooleanSubject()('bannou-texthooker-blurStats', defaultSettings.blurStats$);

export const customCSS$ = writableStringSubject()('bannou-texthooker-customCSS', defaultSettings.customCSS$);

export const timeValue$ = writableNumberSubject()('bannou-texthooker-timeValue', 0, persistStats$);

export const notesOpen$ = writableSubject<boolean>(false);

export const userNotes$ = writableStringSubject()('bannou-texthooker-userNotes', '', persistNotes$);

export const socketState$ = writableSubject<number>(-1);

export const openDialog$ = writableSubject<Record<string, any>>(undefined);

export const dialogOpen$ = writableSubject<boolean>(false);

export const lineData$ = writeableArraySubject<LineItem>()('bannou-texthooker-lineData', [], persistLines$);

export const actionHistory$ = writeableArraySubject<LineItem[]>()(
	'bannou-texthooker-actionHistory',
	[],
	persistActionHistory$
);

export const flashOnPauseTimeout$ = writable<number>(undefined);

export const isPaused$ = writableSubject<boolean>(true);

export const newLine$ = new Subject<string>();

export async function resetAllData() {
	const { canceled } = await new Promise<DialogResult>((resolve) => {
		openDialog$.next({
			icon: mdiHelpCircle,
			message: 'All Settings and Data will be reset',
			callback: resolve,
		});
	});

	if (!canceled) {
		isPaused$.next(true);
		timeValue$.next(0);
		userNotes$.next('');
		lineData$.next([]);
		actionHistory$.next([]);
		flashOnPauseTimeout$.set(undefined);

		window.localStorage.removeItem('bannou-texthooker-timeValue');
		window.localStorage.removeItem('bannou-texthooker-userNotes');
		window.localStorage.removeItem('bannou-texthooker-lineData');
		window.localStorage.removeItem('bannou-texthooker-actionHistory');

		theme$.next(defaultSettings.theme$);
		windowTitle$.next(defaultSettings.windowTitle$);
		websocketUrl$.next(defaultSettings.websocketUrl$);
		fontSize$.next(defaultSettings.fontSize$);
		onlineFont$.next(defaultSettings.onlineFont$);
		afkTimer$.next(defaultSettings.afkTimer$);
		adjustTimerOnAfk$.next(defaultSettings.adjustTimerOnAfk$);
		enableExternalClipboardMonitor$.next(defaultSettings.enableExternalClipboardMonitor$);
		persistStats$.next(defaultSettings.persistStats$);
		persistNotes$.next(defaultSettings.persistNotes$);
		persistLines$.next(defaultSettings.persistLines$);
		persistActionHistory$.next(defaultSettings.persistActionHistory$);
		enablePaste$.next(defaultSettings.enablePaste$);
		flashOnMissedLine$.next(defaultSettings.flashOnMissedLine$);
		allowNewLineDuringPause$.next(defaultSettings.allowNewLineDuringPause$);
		autoStartTimerDuringPause$.next(defaultSettings.autoStartTimerDuringPause$);
		preventLastDuplicate$.next(defaultSettings.preventLastDuplicate$);
		preventGlobalDuplicate$.next(defaultSettings.preventGlobalDuplicate$);
		displayVertical$.next(defaultSettings.displayVertical$);
		reverseLineOrder$.next(defaultSettings.reverseLineOrder$);
		preserveWhitespace$.next(defaultSettings.preserveWhitespace$);
		removeAllWhitespace$.next(defaultSettings.removeAllWhitespace$);
		showTimer$.next(defaultSettings.showTimer$);
		showSpeed$.next(defaultSettings.showSpeed$);
		showCharacterCount$.next(defaultSettings.showCharacterCount$);
		showLineCount$.next(defaultSettings.showLineCount$);
		blurStats$.next(defaultSettings.blurStats$);
		customCSS$.next(defaultSettings.customCSS$);
	}
}
