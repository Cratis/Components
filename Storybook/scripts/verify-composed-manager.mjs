// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const outputRoot = path.join(repositoryRoot, 'Source/storybook-static');
const knownStoryId = 'common-button--label';
const sourceRendererId = 'cratis-mui';
const targetRendererId = 'cratis-primereact10';

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
};

const resolveRequest = (requestUrl) => {
    const rawPathname = (requestUrl ?? '/').split(/[?#]/u, 1)[0];
    const decodedRawPathname = decodeURIComponent(rawPathname).replaceAll('\\', '/');
    if (decodedRawPathname.split('/').includes('..')) return undefined;
    const pathname = decodeURIComponent(
        new URL(requestUrl ?? '/', 'http://localhost').pathname,
    );
    const requested = path.resolve(outputRoot, `.${pathname}`);
    const relative = path.relative(outputRoot, requested);
    if (
        relative === '..' ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
    ) {
        return undefined;
    }
    if (existsSync(requested) && statSync(requested).isDirectory()) {
        return path.join(requested, 'index.html');
    }
    return existsSync(requested) ? requested : path.join(outputRoot, 'index.html');
};

if (!existsSync(path.join(outputRoot, 'index.html'))) {
    throw new Error('Build the composed Storybook before verifying its manager.');
}
if (
    resolveRequest('/../outside') !== undefined ||
    resolveRequest('/%2e%2e/outside') !== undefined
) {
    throw new Error('The composed Storybook verifier accepted a traversal path.');
}

const server = createServer((request, response) => {
    let file;
    try {
        file = resolveRequest(request.url);
    } catch {
        response.writeHead(400).end('Invalid URL');
        return;
    }
    if (!file || !existsSync(file)) {
        response.writeHead(404).end('Not found');
        return;
    }
    response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
    });
    response.end(readFileSync(file));
});

await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
});

const address = server.address();
if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Could not determine the composed Storybook test port.');
}

const baseUrl = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${baseUrl}/?path=/story/${sourceRendererId}_${knownStoryId}`, {
        waitUntil: 'domcontentloaded',
    });

    const selector = page.locator('select[aria-label="Renderer"]');
    await selector.waitFor({ state: 'visible', timeout: 30_000 });
    const options = await selector.locator('option').allTextContents();
    if (options.length !== 4 || !options.includes('Cratis PrimeReact 10 renderer')) {
        throw new Error(`Expected four renderer options, found: ${options.join(', ')}.`);
    }
    if ((await selector.inputValue()) !== sourceRendererId) {
        throw new Error(
            'The renderer selector did not reflect the initial composed ref.',
        );
    }

    // Composition loads referenced indexes asynchronously after the manager toolbar appears.
    await page.waitForTimeout(1_000);
    await selector.selectOption(targetRendererId);
    const expectedPath = `/story/${targetRendererId}_${knownStoryId}`;
    await page.waitForURL(
        (url) => new URL(url).searchParams.get('path') === expectedPath,
        { timeout: 30_000 },
    );
    await page.waitForTimeout(500);

    const childUrl = page
        .frames()
        .map((frame) => frame.url())
        .find(
            (url) =>
                url.includes(`/renderers/${targetRendererId}/iframe.html`) &&
                url.includes(`id=${knownStoryId}`),
        );
    if (!childUrl) {
        throw new Error(
            'The selected renderer preview iframe did not load the preserved story.',
        );
    }
    if (pageErrors.length > 0) {
        throw new Error(`Composed manager page errors: ${pageErrors.join(' | ')}`);
    }

    console.log(
        `Composed manager verified: ${sourceRendererId} -> ${targetRendererId}, preserved '${knownStoryId}', loaded ${childUrl}.`,
    );
} finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
}
