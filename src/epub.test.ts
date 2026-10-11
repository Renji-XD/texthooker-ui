import fc from 'fast-check';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { buildEpub } from './epub';

const xmlCharacterReference = /&#(\d+);/g;

// Strips what XML cannot hold and \r, which the exporter normalizes to \n.
const xmlSafeText = fc
	.stringOf(fc.oneof(fc.constantFrom('<', '>', '&', '"', "'", '#', ';', '\n'), fc.fullUnicode()))
	.map((text) => text.replace(/[\u0000-\u0008\u000B-\u001F\uFFFE\uFFFF]/g, ''));

function readChapterBody(epub: Uint8Array) {
	const html = strFromU8(unzipSync(epub)['OEBPS/chapter.xhtml']);

	return html.slice(html.indexOf('<body>') + '<body>'.length, html.indexOf('</body>'));
}

function readChapterLines(epub: Uint8Array) {
	return [...readChapterBody(epub).matchAll(/<p>(.*?)<\/p>/gs)].map(([, paragraph]) =>
		paragraph
			.split('<br/>')
			.map((part) => part.replace(xmlCharacterReference, (_, code) => String.fromCharCode(Number(code))))
			.join('\n')
	);
}

describe('buildEpub', () => {
	it('keeps every line, in order', () => {
		fc.assert(
			fc.property(fc.array(xmlSafeText), (lines) => {
				const epub = buildEpub(lines, 'title');

				expect(readChapterLines(epub)).toEqual(lines);
				// Only our own tags and numeric character references may remain.
				expect(readChapterBody(epub).replace(/<\/?p>|<br\/>/g, '')).not.toMatch(/[<>"']|&(?!#\d+;)/);
			})
		);
	});

	it('stores `mimetype` first, uncompressed and without extra fields', () => {
		const epub = buildEpub(['line'], 'title');
		const view = new DataView(epub.buffer, epub.byteOffset, epub.byteLength);
		const nameLength = view.getUint16(26, true);
		const extraLength = view.getUint16(28, true);
		const dataStart = 30 + nameLength + extraLength;

		expect(view.getUint32(0, true)).toBe(0x04034b50);
		expect(view.getUint16(8, true)).toBe(0);
		expect(extraLength).toBe(0);
		expect(strFromU8(epub.subarray(30, 30 + nameLength))).toBe('mimetype');
		expect(strFromU8(epub.subarray(dataStart, dataStart + 'application/epub+zip'.length))).toBe(
			'application/epub+zip'
		);
	});

	it('escapes markup and drops characters XML forbids', () => {
		const epub = buildEpub(['a\u0000<b>&"\'', 'x\ny'], 'title');

		expect(readChapterBody(epub)).toBe('<p>a&#60;b&#62;&#38;&#34;&#39;</p><p>x<br/>y</p>');
	});
});
