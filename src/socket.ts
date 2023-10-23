import { NEVER, Subscription, filter, switchMap } from 'rxjs';
import { continuousReconnect$, newLine$, reconnectSocket$, socketState$, websocketUrl$ } from './stores/stores';

import { LineType } from './types';

export class SocketConnection {
	private websocketUrl: string;

	private socket: WebSocket | undefined;

	private subscriptions: Subscription[] = [];

	constructor() {
		this.subscriptions.push(
			websocketUrl$.subscribe((websocketUrl) => {
				if (websocketUrl !== this.websocketUrl) {
					this.websocketUrl = websocketUrl;
					this.reloadSocket();
				}
			}),
			continuousReconnect$
				.pipe(
					switchMap((continuousReconnect) =>
						continuousReconnect ? reconnectSocket$.pipe(filter(() => this.socket?.readyState === 3)) : NEVER
					)
				)
				.subscribe(() => this.reloadSocket())
		);
	}

	getCurrentUrl() {
		return this.websocketUrl;
	}

	connect() {
		if (this.socket?.readyState < 2) {
			return;
		}

		if (!this.websocketUrl) {
			socketState$.next(3);
			return;
		}

		socketState$.next(0);

		try {
			this.socket = new WebSocket(this.websocketUrl);
			this.socket.onopen = this.updateSocketState.bind(this);
			this.socket.onclose = this.updateSocketState.bind(this);
			this.socket.onmessage = this.handleMessage.bind(this);
		} catch (error) {
			socketState$.next(3);
		}
	}

	disconnect() {
		if (this.socket?.readyState === 1) {
			this.socket.close(1000, 'User Request');
		}
	}

	cleanUp() {
		this.disconnect();

		for (let index = 0, { length } = this.subscriptions; index < length; index += 1) {
			this.subscriptions[index].unsubscribe();
		}
	}

	private reloadSocket() {
		this.disconnect();
		this.socket = undefined;
		this.connect();
	}

	private updateSocketState() {
		if (!this.socket) {
			return;
		}

		socketState$.next(this.socket.readyState);
	}

	private handleMessage(event: MessageEvent) {
		let line = event.data;

		try {
			line = JSON.parse(event.data)?.sentence || event.data;
		} catch (_) {
			// no-op
		}

		newLine$.next([line, LineType.SOCKET]);
	}
}
