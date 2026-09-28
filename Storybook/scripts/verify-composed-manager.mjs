// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';
import { managerStoryPath, previewStoryPath, selectLinkStory } from './lib/composed-story-links.mjs';
import { verifyRendererOptions } from './lib/renderer-options.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const outputRoot = path.join(repositoryRoot, 'Source/storybook-static');
const inventory = discoverAdapterPackages(repositoryRoot);
const snapshot = JSON.parse(readFileSync(path.join(storybookRoot, 'scripts/storybook-inventory.json'), 'utf8'));
const storyId = selectLinkStory(snapshot);
for (const adapter of inventory.adapters) {
    const refId = adapter.metadata.id;
    const indexFile = path.join(outputRoot, 'renderers', refId, 'index.json');
    if (!existsSync(indexFile)) throw new Error(`Missing built Storybook index for '${refId}'.`);
    const index = JSON.parse(readFileSync(indexFile, 'utf8'));
    if (index.entries?.[storyId]?.type !== 'story') {
        throw new Error(`Story '${storyId}' is missing from '${refId}' index; update the inventory and story links if it was renamed.`);
    }
}
// Keep the existing MUI -> PrimeReact 10 cross-adapter switching coverage.
const sourceRendererId = inventory.adapters.find(adapter => adapter.metadata.id === 'cratis-mui')?.metadata.id;
const targetRendererId = inventory.adapters.find(adapter => adapter.metadata.id === 'cratis-primereact10')?.metadata.id;
if (!sourceRendererId || !targetRendererId) {
    throw new Error('The composed manager link verification requires an adapter source and the PrimeReact 10 target.');
}

const documentedLinks = readFileSync(path.join(repositoryRoot, 'Documentation/storybook.mdx'), 'utf8');
const requiredLinks = [
    ...inventory.adapters.map(adapter => managerStoryPath(adapter.metadata.id, storyId)),
    managerStoryPath(sourceRendererId, storyId, true),
    previewStoryPath(sourceRendererId, storyId),
];
for (const link of requiredLinks) {
    if (!documentedLinks.includes(link)) {
        throw new Error(`Documentation/storybook.mdx is missing the verified story link '${link}'; check for a renamed or missing story.`);
    }
}

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
    const rendererSnapshot = JSON.parse(readFileSync(path.join(storybookRoot, 'scripts/renderer-inventory.json'), 'utf8'));
    const selectorQuery = 'select[aria-label="Renderer"]';
    const managerPath = refId => managerStoryPath(refId, storyId);
    const previewPath = refId => previewStoryPath(refId, storyId);

    const checkPage = async (label, urlPath, expectedRef, { directPreview = false } = {}) => {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
            await page.goto(`${baseUrl}${urlPath}`, { waitUntil: 'domcontentloaded' });
            if (directPreview) {
                // An iframe.html is the renderer's preview, not a composed manager: its URL owns
                // both the renderer and the story id, and it has no renderer selector.
                await page.locator('#storybook-root > *').first().waitFor({ timeout: 30_000 });
                if (new URL(page.url()).searchParams.get('id') !== storyId ||
                    !new URL(page.url()).pathname.endsWith(`/renderers/${expectedRef}/iframe.html`)) {
                    throw new Error(`Preview URL did not preserve '${expectedRef}' and '${storyId}'.`);
                }
            } else {
                const selector = page.locator(selectorQuery);
                await selector.waitFor({ state: 'visible', timeout: 30_000 });
                const options = await selector.locator('option').evaluateAll(elements => elements.map(option => ({
                    id: option.value,
                    label: option.textContent ?? '',
                })));
                verifyRendererOptions(options, inventory.adapters, rendererSnapshot);
                await page.waitForFunction(
                    ({ selectorQuery, expectedRef, storyId }) => {
                        const select = document.querySelector(selectorQuery);
                        return select?.value === expectedRef && Array.from(document.querySelectorAll('iframe'))
                            .some(frame => {
                                const url = new URL(frame.src, location.href);
                                return url.pathname.endsWith(`/renderers/${expectedRef}/iframe.html`) &&
                                    url.searchParams.get('id') === storyId;
                            });
                    },
                    { selectorQuery, expectedRef, storyId },
                    { timeout: 30_000 },
                );
                const frame = page.frames().find(frame => {
                    const url = new URL(frame.url());
                    return url.pathname.endsWith(`/renderers/${expectedRef}/iframe.html`) &&
                        url.searchParams.get('id') === storyId;
                });
                if (!frame) throw new Error(`Preview iframe for '${expectedRef}' story '${storyId}' did not load.`);
                await frame.locator('#storybook-root > *').first().waitFor({ timeout: 30_000 });
            }
            if (errors.length) throw new Error(`Page errors: ${errors.join(' | ')}`);
            console.log(`Verified ${label}: ${urlPath} -> ${expectedRef} / ${storyId}.`);
            return page;
        } catch (error) {
            await page.close();
            throw new Error(`${label} (${urlPath}) did not resolve '${expectedRef}' story '${storyId}': ${error.message}`, { cause: error });
        }
    };

    // The manager has no unprefixed composition ref and does not read ?story=.
    // Neither form may be mistaken for a stable renderer/story link.
    for (const unsupportedPath of [`/?path=/story/${storyId}`, `/?story=${sourceRendererId}_${storyId}`]) {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
            await page.goto(`${baseUrl}${unsupportedPath}`, { waitUntil: 'domcontentloaded' });
            await page.locator(selectorQuery).waitFor({ state: 'visible', timeout: 30_000 });
            await page.waitForLoadState('networkidle');
            const selected = await page.locator(selectorQuery).inputValue();
            const preview = page.frames().find(frame =>
                inventory.adapters.some(adapter => {
                    const url = new URL(frame.url() || 'about:blank');
                    return url.pathname.endsWith(`/renderers/${adapter.metadata.id}/iframe.html`) &&
                        url.searchParams.get('id') === storyId;
                }),
            );
            if (errors.length) throw new Error(`Page errors: ${errors.join(' | ')}`);
            if (selected || preview) {
                throw new Error(`Unsupported URL selected '${selected}' (preview: '${preview?.url()}'); check whether the URL contract changed.`);
            }
            console.log(`Verified unsupported ${unsupportedPath} selects no renderer or story preview; do not link to it.`);
        } finally {
            await page.close();
        }
    }

    for (const adapter of inventory.adapters) {
        const refId = adapter.metadata.id;
        const page = await checkPage(`${refId} manager link`, managerPath(refId), refId);
        await page.close();
    }
    // The root iframe.html belongs to the manager's own placeholder index, not the
    // composed renderer indexes. Only /renderers/<ref>/iframe.html?id=<id> is a preview.
    const rootIframe = await browser.newPage();
    const rootIframeErrors = [];
    rootIframe.on('pageerror', error => rootIframeErrors.push(error.message));
    try {
        const unsupportedIframe = `/iframe.html?id=${sourceRendererId}_${storyId}`;
        await rootIframe.goto(`${baseUrl}${unsupportedIframe}`, { waitUntil: 'domcontentloaded' });
        await rootIframe.waitForLoadState('networkidle');
        if (await rootIframe.locator(selectorQuery).count() || rootIframe.frames().some(frame =>
            frame.url().includes(`/renderers/${sourceRendererId}/iframe.html?id=${storyId}`))) {
            throw new Error(`Root ${unsupportedIframe} unexpectedly loaded a composed renderer preview.`);
        }
        if (rootIframeErrors.length) throw new Error(`Root iframe page errors: ${rootIframeErrors.join(' | ')}`);
        console.log(`Verified unsupported ${unsupportedIframe} has no renderer selector or composed story preview.`);
    } finally {
        await rootIframe.close();
    }
    // The docs embed the composed manager, so also test a manager URL in an iframe,
    // with Storybook's embed parameter. The ref prefix still belongs in ?path=.
    const embedHost = await browser.newPage();
    const embedErrors = [];
    embedHost.on('pageerror', error => embedErrors.push(error.message));
    const embedRef = sourceRendererId;
    const embedPath = managerStoryPath(embedRef, storyId, true);
    await embedHost.setContent(`<iframe title="Storybook" src="${baseUrl}${embedPath}"></iframe>`);
    try {
        const embedded = embedHost.frameLocator('iframe[title="Storybook"]');
        await embedded.locator(selectorQuery).waitFor({ state: 'visible', timeout: 30_000 });
        await embedded.locator(selectorQuery).evaluate((element, expectedRef) => {
            if (element.value !== expectedRef) throw new Error(`Embedded manager selected '${element.value}' rather than '${expectedRef}'.`);
        }, embedRef);
        const managerFrame = embedHost.frames().find(frame => frame.url().includes(embedPath));
        if (!managerFrame) throw new Error('Embedded composed manager did not load.');
        await managerFrame.waitForFunction(({ refId, storyId }) =>
            Array.from(document.querySelectorAll('iframe')).some(frame => {
                const url = new URL(frame.src, location.href);
                return url.pathname.endsWith(`/renderers/${refId}/iframe.html`) &&
                    url.searchParams.get('id') === storyId;
            }), { refId: embedRef, storyId }, { timeout: 30_000 });
        const preview = managerFrame.childFrames().find(frame => {
            const url = new URL(frame.url());
            return url.pathname.endsWith(`/renderers/${embedRef}/iframe.html`) && url.searchParams.get('id') === storyId;
        });
        if (!preview) throw new Error('Embedded manager preview iframe did not load the story.');
        await preview.locator('#storybook-root > *').first().waitFor({ timeout: 30_000 });
        if (embedErrors.length) throw new Error(`Embedded page errors: ${embedErrors.join(' | ')}`);
        console.log(`Verified iframe-embedded composed manager: ${embedPath} -> ${embedRef} / ${storyId}.`);
    } finally {
        await embedHost.close();
    }

    for (const adapter of inventory.adapters) {
        const refId = adapter.metadata.id;
        const page = await checkPage(`${refId} direct preview`, previewPath(refId), refId, { directPreview: true });
        await page.close();
    }

    // Preserve the renderer-switching check in addition to verifying independent links.
    const switchPage = await checkPage('switch source', managerPath(sourceRendererId), sourceRendererId);
    const switchErrors = [];
    switchPage.on('pageerror', error => switchErrors.push(error.message));
    try {
        await switchPage.locator(selectorQuery).selectOption(targetRendererId);
        await switchPage.waitForURL(url => url.searchParams.get('path') === `/story/${targetRendererId}_${storyId}`, { timeout: 30_000 });
        await switchPage.waitForFunction(({ refId, storyId, selectorQuery }) =>
            document.querySelector(selectorQuery)?.value === refId &&
            Array.from(document.querySelectorAll('iframe')).some(frame => {
                const url = new URL(frame.src, location.href);
                return url.pathname.endsWith(`/renderers/${refId}/iframe.html`) &&
                    url.searchParams.get('id') === storyId;
            }), { refId: targetRendererId, storyId, selectorQuery }, { timeout: 30_000 });
        const switched = switchPage.frames().find(frame => {
            const url = new URL(frame.url() || 'about:blank');
            return url.pathname.endsWith(`/renderers/${targetRendererId}/iframe.html`) && url.searchParams.get('id') === storyId;
        });
        if (!switched) throw new Error(`Switch did not load '${storyId}' in '${targetRendererId}' preview iframe.`);
        await switched.locator('#storybook-root > *').first().waitFor({ timeout: 30_000 });
        if (switchErrors.length) throw new Error(`Switch page errors: ${switchErrors.join(' | ')}`);
        console.log(`Verified renderer switch: ${sourceRendererId} -> ${targetRendererId}, preserved '${storyId}'.`);
    } finally {
        await switchPage.close();
    }
} finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
}
