// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const markdownExtensions = new Set(['.md', '.mdx']);
const selfTestMode = process.argv[2] === '--self-test';
const documentationRoot = path.resolve(selfTestMode
    ? path.dirname(fileURLToPath(import.meta.url))
    : (process.argv[2] ?? path.dirname(fileURLToPath(import.meta.url))));
const counts = {
    files: 0,
    local: 0,
    siteRoutes: 0,
    externalHttp: 0,
    localhost: 0,
    otherSchemes: 0
};
const failures = [];
const anchorsByFile = new Map();

if (selfTestMode) {
    runSelfTests();
} else {
    verifyDocumentation();
}

function verifyDocumentation() {
    const markdownFiles = findMarkdownFiles(documentationRoot);
    counts.files = markdownFiles.length;

    for (const sourceFile of markdownFiles) {
        checkFile(sourceFile);
    }

    console.log(`Markdown files scanned: ${counts.files}`);
    console.log(`Local links checked: ${counts.local}`);
    console.log('Intentional exclusions:');
    console.log(`  Documentation-site root routes: ${counts.siteRoutes}`);
    console.log(`  External HTTP(S) links: ${counts.externalHttp}`);
    console.log(`  Localhost HTTP(S) links: ${counts.localhost}`);
    console.log(`  Other non-file URI schemes: ${counts.otherSchemes}`);

    if (counts.files === 0) {
        failures.push('No Markdown files were found.');
    }
    if (counts.local === 0) {
        failures.push('No local links were found; refusing to report a vacuous successful scan.');
    }

    if (failures.length > 0) {
        console.error('');
        console.error(`Broken local links: ${failures.length}`);
        for (const failure of failures) {
            console.error(`  ${failure}`);
        }
        process.exitCode = 1;
    } else {
        console.log('Broken local links: 0');
    }
}

function runSelfTests() {
    const destinations = [];
    collectInlineLinkDestinations([
        '[escaped](guide\\(advanced\\).md#A\\-heading)',
        '[nested [label]](<route with spaces.mdx#anchor>)',
        '[title](route/index "A (title)")'
    ].join('\n'), destinations);

    assertSelfTest(
        destinations.map(destination => destination.target).join('|') ===
            'guide(advanced).md#A-heading|route with spaces.mdx#anchor|route/index',
        'escaped, nested, and titled inline destinations are parsed incorrectly'
    );

    const malformedHeading = 'Safe <<span data-label=">">Injected</span>> Heading';
    assertSelfTest(
        slugifyHeading(malformedHeading) === 'safe-heading',
        'nested HTML can bypass heading normalization'
    );
    assertSelfTest(
        slugifyHeading('Use <code>Canvas</code> &amp; Data') === 'use-canvas-data',
        'valid inline HTML is stripped incorrectly'
    );

    const malformedDestination = `[malformed](${'\\x'.repeat(100_000)}`;
    const malformedDestinations = [];
    const startedAt = process.hrtime.bigint();
    collectInlineLinkDestinations(malformedDestination, malformedDestinations);
    const elapsedMilliseconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    assertSelfTest(malformedDestinations.length === 0, 'a malformed destination was accepted');
    assertSelfTest(elapsedMilliseconds < 2_000, `malformed destination parsing took ${elapsedMilliseconds.toFixed(1)} ms`);

    console.log(`Self-test passed: adversarial destination parsed in ${elapsedMilliseconds.toFixed(1)} ms; nested heading markup normalized.`);
}

function assertSelfTest(condition, message) {
    if (!condition) {
        throw new Error(`Self-test failed: ${message}`);
    }
}

function findMarkdownFiles(root) {
    const files = [];

    function visit(directory) {
        const entries = fs.readdirSync(directory, { withFileTypes: true })
            .sort((left, right) => left.name.localeCompare(right.name));

        for (const entry of entries) {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(entryPath);
            } else if (entry.isFile() && markdownExtensions.has(path.extname(entry.name).toLowerCase())) {
                files.push(entryPath);
            }
        }
    }

    visit(root);
    return files;
}

function checkFile(sourceFile) {
    const content = fs.readFileSync(sourceFile, 'utf8');
    const linkContent = maskInlineCode(maskFencedCode(content));
    const references = readReferenceDefinitions(maskFencedCode(content));
    const destinations = [];

    collectInlineLinkDestinations(linkContent, destinations);

    const referenceLinkPattern = /!?\[([^\]\n]+)\]\[([^\]\n]*)\]/g;
    collectMatches(linkContent, referenceLinkPattern, destinations, match => {
        const referenceName = normalizeReferenceName(match[2] || match[1]);
        const definition = references.get(referenceName);
        if (!definition) {
            failures.push(`${displayPath(sourceFile)}:${lineNumberAt(content, match.index)} unresolved reference link "${referenceName}"`);
            return undefined;
        }
        return definition;
    });

    const htmlLinkPattern = /\b(?:href|src|link)\s*=\s*(['"])(.*?)\1/g;
    collectMatches(linkContent, htmlLinkPattern, destinations, match => match[2]);

    destinations.sort((left, right) => left.index - right.index);
    for (const destination of destinations) {
        checkDestination(sourceFile, content, destination);
    }
}

function collectInlineLinkDestinations(content, destinations) {
    let position = 0;
    while (position < content.length) {
        if (content[position] === '\\') {
            position += 2;
            continue;
        }
        if (content[position] !== '[') {
            position += 1;
            continue;
        }

        const parsedLink = parseInlineLink(content, position);
        if (!parsedLink) {
            position += 1;
            continue;
        }

        const linkIndex = position > 0 && content[position - 1] === '!' ? position - 1 : position;
        destinations.push({ index: linkIndex, target: unescapeMarkdown(parsedLink.target.trim()) });
        position = parsedLink.end;
    }
}

function parseInlineLink(content, labelStart) {
    let bracketDepth = 1;
    let position = labelStart + 1;

    while (position < content.length && bracketDepth > 0) {
        const character = content[position];
        if (character === '\\') {
            position += 2;
            continue;
        }
        if (character === '[') {
            bracketDepth += 1;
        } else if (character === ']') {
            bracketDepth -= 1;
        }
        position += 1;
    }

    if (bracketDepth !== 0 || content[position] !== '(') {
        return undefined;
    }

    return parseInlineDestination(content, position);
}

function parseInlineDestination(content, openingParenthesis) {
    let position = skipMarkdownWhitespace(content, openingParenthesis + 1);
    const destinationStart = position;

    if (content[position] === '<') {
        position += 1;
        const enclosedStart = position;
        while (position < content.length) {
            const character = content[position];
            if (character === '\\') {
                position += 2;
                continue;
            }
            if (character === '\n' || character === '\r' || character === '<') {
                return undefined;
            }
            if (character === '>') {
                return finishInlineDestination(content, position + 1, enclosedStart, position);
            }
            position += 1;
        }
        return undefined;
    }

    let parenthesisDepth = 0;
    while (position < content.length) {
        const character = content[position];
        if (character === '\\') {
            position += 2;
            continue;
        }
        if (character === '(') {
            parenthesisDepth += 1;
        } else if (character === ')') {
            if (parenthesisDepth === 0) {
                return {
                    target: content.slice(destinationStart, position),
                    end: position + 1
                };
            }
            parenthesisDepth -= 1;
        } else if (isMarkdownWhitespace(character)) {
            if (parenthesisDepth !== 0) {
                return undefined;
            }
            return finishInlineDestination(content, position, destinationStart, position);
        }
        position += 1;
    }

    return undefined;
}

function finishInlineDestination(content, tailStart, destinationStart, destinationEnd) {
    const positionAfterWhitespace = skipMarkdownWhitespace(content, tailStart);
    if (content[positionAfterWhitespace] === ')') {
        return {
            target: content.slice(destinationStart, destinationEnd),
            end: positionAfterWhitespace + 1
        };
    }
    if (positionAfterWhitespace === tailStart) {
        return undefined;
    }

    const titleOpening = content[positionAfterWhitespace];
    const titleClosing = titleOpening === '(' ? ')' : titleOpening;
    if (titleOpening !== '"' && titleOpening !== "'" && titleOpening !== '(') {
        return undefined;
    }

    let position = positionAfterWhitespace + 1;
    while (position < content.length) {
        if (content[position] === '\\') {
            position += 2;
            continue;
        }
        if (content[position] === titleClosing) {
            position = skipMarkdownWhitespace(content, position + 1);
            if (content[position] === ')') {
                return {
                    target: content.slice(destinationStart, destinationEnd),
                    end: position + 1
                };
            }
            return undefined;
        }
        position += 1;
    }

    return undefined;
}

function skipMarkdownWhitespace(content, start) {
    let position = start;
    while (position < content.length && isMarkdownWhitespace(content[position])) {
        position += 1;
    }
    return position;
}

function isMarkdownWhitespace(character) {
    return character === ' ' || character === '\t' || character === '\n' || character === '\r';
}

function collectMatches(content, pattern, destinations, getTarget) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
        const target = getTarget(match);
        if (target !== undefined) {
            destinations.push({ index: match.index, target: unescapeMarkdown(target.trim()) });
        }
    }
}

function readReferenceDefinitions(content) {
    const definitions = new Map();
    const definitionPattern = /^ {0,3}\[([^\]\n]+)\]:\s*(?:<([^>\n]+)>|(\S+))/gm;
    let match;
    while ((match = definitionPattern.exec(content)) !== null) {
        definitions.set(normalizeReferenceName(match[1]), unescapeMarkdown(match[2] ?? match[3]));
    }
    return definitions;
}

function normalizeReferenceName(value) {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function checkDestination(sourceFile, content, destination) {
    const target = destination.target;
    const lineNumber = lineNumberAt(content, destination.index);

    if (target.startsWith('//')) {
        counts.externalHttp += 1;
        return;
    }

    if (/^https?:\/\//i.test(target)) {
        const url = new URL(target);
        if (isLocalhost(url.hostname)) {
            counts.localhost += 1;
        } else {
            counts.externalHttp += 1;
        }
        return;
    }

    if (target.startsWith('/')) {
        counts.siteRoutes += 1;
        return;
    }

    if (/^[a-z][a-z\d+.-]*:/i.test(target)) {
        counts.otherSchemes += 1;
        return;
    }

    counts.local += 1;
    checkLocalDestination(sourceFile, target, lineNumber);
}

function checkLocalDestination(sourceFile, target, lineNumber) {
    const hashIndex = target.indexOf('#');
    const queryIndex = target.indexOf('?');
    const pathEnd = [hashIndex, queryIndex].filter(index => index >= 0)
        .reduce((current, index) => Math.min(current, index), target.length);
    const encodedPath = target.slice(0, pathEnd);
    const encodedFragment = hashIndex >= 0
        ? target.slice(hashIndex + 1, queryIndex > hashIndex ? queryIndex : target.length)
        : undefined;

    let targetPath;
    let fragment;
    try {
        targetPath = decodeURIComponent(encodedPath);
        fragment = encodedFragment === undefined ? undefined : decodeURIComponent(encodedFragment);
    } catch {
        failures.push(`${displayPath(sourceFile)}:${lineNumber} has invalid URL encoding in "${target}"`);
        return;
    }

    const unresolvedPath = targetPath.length === 0
        ? sourceFile
        : path.resolve(path.dirname(sourceFile), targetPath);
    const relativeToDocumentation = path.relative(documentationRoot, unresolvedPath);
    if (relativeToDocumentation === '..' || relativeToDocumentation.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToDocumentation)) {
        failures.push(`${displayPath(sourceFile)}:${lineNumber} escapes Documentation with "${target}"`);
        return;
    }

    const resolvedFile = resolveDocumentationFile(unresolvedPath);
    if (!resolvedFile) {
        failures.push(`${displayPath(sourceFile)}:${lineNumber} cannot resolve "${target}"`);
        return;
    }

    if (fragment && !anchorsFor(resolvedFile).has(fragment)) {
        failures.push(`${displayPath(sourceFile)}:${lineNumber} cannot find anchor "#${fragment}" in ${displayPath(resolvedFile)}`);
    }
}

function resolveDocumentationFile(unresolvedPath) {
    const candidates = [unresolvedPath];
    if (path.extname(unresolvedPath) === '') {
        candidates.push(`${unresolvedPath}.md`, `${unresolvedPath}.mdx`);
    }
    candidates.push(path.join(unresolvedPath, 'index.md'), path.join(unresolvedPath, 'index.mdx'));

    return candidates.find(candidate => isExactCaseFile(candidate));
}

function isExactCaseFile(candidate) {
    const relative = path.relative(documentationRoot, candidate);
    if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        return false;
    }

    let current = documentationRoot;
    for (const segment of relative.split(path.sep)) {
        let entries;
        try {
            entries = fs.readdirSync(current);
        } catch {
            return false;
        }
        if (!entries.includes(segment)) {
            return false;
        }
        current = path.join(current, segment);
    }

    try {
        return fs.statSync(current).isFile();
    } catch {
        return false;
    }
}

function anchorsFor(file) {
    if (anchorsByFile.has(file)) {
        return anchorsByFile.get(file);
    }

    const content = maskFencedCode(fs.readFileSync(file, 'utf8'));
    const anchors = new Set();
    const slugOccurrences = new Map();
    const headingPattern = /^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm;
    let match;

    while ((match = headingPattern.exec(content)) !== null) {
        const baseSlug = slugifyHeading(match[1]);
        const occurrence = slugOccurrences.get(baseSlug) ?? 0;
        slugOccurrences.set(baseSlug, occurrence + 1);
        anchors.add(occurrence === 0 ? baseSlug : `${baseSlug}-${occurrence}`);
    }

    const explicitIdPattern = /\bid\s*=\s*(['"])([^'"]+)\1/g;
    while ((match = explicitIdPattern.exec(content)) !== null) {
        anchors.add(match[2]);
    }

    anchorsByFile.set(file, anchors);
    return anchors;
}

function slugifyHeading(heading) {
    return stripHeadingTags(heading)
        .replace(/&[a-z\d#]+;/gi, '')
        .trim()
        .toLowerCase()
        .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '')
        .replace(/\s+/g, '-');
}

function stripHeadingTags(heading) {
    const output = [];
    const pendingTag = [];
    let tagDepth = 0;
    let braceDepth = 0;
    let quote;
    let escaped = false;

    for (const character of heading) {
        if (tagDepth === 0) {
            if (character === '<') {
                tagDepth = 1;
                pendingTag.push(character);
            } else {
                output.push(character);
            }
            continue;
        }

        pendingTag.push(character);
        if (escaped) {
            escaped = false;
            continue;
        }
        if (quote) {
            if (character === '\\') {
                escaped = true;
            } else if (character === quote) {
                quote = undefined;
            }
            continue;
        }
        if (character === '"' || character === "'") {
            quote = character;
        } else if (character === '{') {
            braceDepth += 1;
        } else if (character === '}' && braceDepth > 0) {
            braceDepth -= 1;
        } else if (character === '<') {
            tagDepth += 1;
        } else if (character === '>' && (tagDepth > 1 || braceDepth === 0)) {
            tagDepth -= 1;
            if (tagDepth === 0) {
                pendingTag.length = 0;
            }
        }
    }

    if (pendingTag.length > 0) {
        output.push(...pendingTag);
    }
    return output.join('');
}

function maskFencedCode(content) {
    let fenceCharacter;
    let fenceLength = 0;

    return content.split(/(?<=\n)/).map(line => {
        const opening = line.match(/^ {0,3}(`{3,}|~{3,})/);
        if (!fenceCharacter && opening) {
            fenceCharacter = opening[1][0];
            fenceLength = opening[1].length;
            return maskLine(line);
        }

        if (fenceCharacter) {
            const closingPattern = new RegExp(`^ {0,3}\\${fenceCharacter}{${fenceLength},}\\s*$`);
            const lineWithoutNewline = line.replace(/\n$/, '');
            if (closingPattern.test(lineWithoutNewline)) {
                fenceCharacter = undefined;
                fenceLength = 0;
            }
            return maskLine(line);
        }

        return line;
    }).join('');
}

function maskInlineCode(content) {
    return content.replace(/(`+)([^`\n]*?)\1/g, match => maskLine(match));
}

function maskLine(value) {
    return value.replace(/[^\n]/g, ' ');
}

function unescapeMarkdown(value) {
    return value.replace(/\\([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~_-])/g, '$1');
}

function isLocalhost(hostname) {
    const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function lineNumberAt(content, index) {
    let lineNumber = 1;
    for (let position = 0; position < index; position += 1) {
        if (content.charCodeAt(position) === 10) {
            lineNumber += 1;
        }
    }
    return lineNumber;
}

function displayPath(file) {
    return path.relative(path.dirname(documentationRoot), file).split(path.sep).join('/');
}
