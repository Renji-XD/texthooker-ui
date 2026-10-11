import { strToU8, zipSync } from 'fflate';

import { generateRandomUUID } from './util';

// XML 1.0 forbids these control characters, even as character references.
// eslint-disable-next-line no-control-regex
const invalidXmlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

function escapeXml(text: string) {
	return text.replace(invalidXmlCharacters, '').replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function toParagraph(line: string) {
	return `<p>${line.split(/\r?\n/).map(escapeXml).join('<br/>')}</p>`;
}

// ponytail: one chapter holds every line; split into chapters if readers choke on huge books.
export function buildEpub(lines: string[], title: string, language = 'ja') {
	const safeTitle = escapeXml(title);
	const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
	const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
	const xhtmlRoot = `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${language}" xml:lang="${language}">`;

	return zipSync({
		// The OCF spec requires `mimetype` first and stored without compression.
		mimetype: [strToU8('application/epub+zip'), { level: 0 }],
		'META-INF/container.xml': strToU8(
			`${xmlHeader}<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`
		),
		'OEBPS/content.opf': strToU8(
			`${xmlHeader}<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">urn:uuid:${generateRandomUUID()}</dc:identifier><dc:title>${safeTitle}</dc:title><dc:language>${language}</dc:language><meta property="dcterms:modified">${modified}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="chapter"/></spine></package>`
		),
		'OEBPS/nav.xhtml': strToU8(
			`${xmlHeader}${xhtmlRoot}<head><meta charset="utf-8"/><title>${safeTitle}</title></head><body><nav epub:type="toc"><ol><li><a href="chapter.xhtml">${safeTitle}</a></li></ol></nav></body></html>`
		),
		'OEBPS/chapter.xhtml': strToU8(
			`${xmlHeader}${xhtmlRoot}<head><meta charset="utf-8"/><title>${safeTitle}</title></head><body>${lines
				.map(toParagraph)
				.join('')}</body></html>`
		),
	});
}
