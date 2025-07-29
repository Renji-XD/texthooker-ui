declare global {
	interface Window {
		documentPictureInPicture: {
			requestWindow: () => Promise<Window | undefined>;
		};
	}
}

export { };

