module.exports = {
	content: ['./src/components/*.{svelte,js,ts}'],
	plugins: [require('@tailwindcss/typography'), require('daisyui')],
	daisyui: {
		themes: ['garden', 'business'],
	},
};
