export enum Theme {
	LIGHT = 'light',
	DARK = 'dark',
	CUPCAKE = 'cupcake',
	BUMBLEBEE = 'bumblebee',
	EMERALD = 'emerald',
	CORPORATE = 'corporate',
	SYNTHWAVE = 'synthwave',
	RETRO = 'retro',
	CYBERPUNK = 'cyberpunk',
	VALENTINE = 'valentine',
	HALLOWEEN = 'halloween',
	GARDEN = 'garden',
	FOREST = 'forest',
	AQUA = 'aqua',
	LOFI = 'lofi',
	PASTEL = 'pastel',
	FANTASY = 'fantasy',
	WIREFRAME = 'wireframe',
	BLACK = 'black',
	LUXURY = 'luxury',
	DRACULA = 'dracula',
	CMYK = 'cmyk',
	AUTUMN = 'autumn',
	BUSINESS = 'business',
	ACID = 'acid',
	LEMONADE = 'lemonade',
	NIGHT = 'night',
	COFFEE = 'coffee',
	WINTER = 'winter',
}

export enum OnlineFont {
	OFF = 'Off',
	NOTO = 'Noto Serif JP',
	KLEE = 'Klee One',
	SHIPPORI = 'Shippori Mincho',
}

export interface DialogResult<T = undefined> {
	canceled: boolean;
	data: T;
}

export enum LineType {
	SOCKET = 'socket',
	PASTE = 'paste',
	EXTERNAL = 'external',
}

export interface LineItem {
	id: string;
	text: string;
	index?: number;
}
