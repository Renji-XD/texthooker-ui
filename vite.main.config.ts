import { GoogleGenAI } from '@google/genai';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { cpSync } from 'fs';
import { dirname, join } from 'path';
import { setDefaultResultOrder } from 'dns';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const geminiPlugin = () => {
	const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

	return {
		name: 'gemini-plugin',
		configureServer(server) {
			server.middlewares.use('/api/gemini', async (req, res) => {
				let body = '';
				req.on('data', (chunk) => {
					body += chunk;
				});
				req.on('end', async () => {
					const { line } = JSON.parse(body);

					if (!line) {
						res.statusCode = 400;
						res.end('Missing line');
						return;
					}

					try {
						const system = `
You're a language teacher. Provide a detailed explanation of the grammar, vocabulary, and context to the user.
The output can have markdown. The output mus never have the markdown separator (---).
`;
						const prompt = `Explain the following Japanese sentence: "${line}". The output mus never have the markdown separator (---).`;
						const response = await ai.models.generateContent({
							model: 'gemini-3-flash-preview',
							contents: prompt,
							config: {
								systemInstruction: system,
							},
						});
						const text = response.text;
						res.end(text);
					} catch (error) {
						res.statusCode = 500;
						console.error(error);
						res.end('Error generating content');
					}
				});
			});
		},
	};
};

const nodeVersion = Number.parseInt(process.versions.node.match(/^(\d+)\./)?.[1] || '17', 10);

if (nodeVersion < 17) {
	setDefaultResultOrder('verbatim');
}

export default defineConfig({
	plugins: [
		svelte(),
		viteSingleFile(),
		(() => {
			{
				return {
					name: 'copy-header',
					writeBundle() {
						cpSync(join(__dirname, 'public', 'assets'), join(__dirname, 'docs', 'assets'), {
							recursive: true,
						});
					},
				};
			}
		})(),
		geminiPlugin(),
	],
	base: '/texthooker-ui',
	build: {
		copyPublicDir: false,
		emptyOutDir: true,
		outDir: './docs',
	},
	server: {
		port: 5174,
	},
});
