// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Runs inside a package-manager-created consumer after the packed Components artifact and its
 * mandatory peers have been installed. Argument 1 is `absent` or `present` for the Pixi topology.
 */

import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const pixiTopology = process.argv[2];
if (pixiTopology !== 'absent' && pixiTopology !== 'present') {
    console.error(`Expected Pixi topology 'absent' or 'present'; got '${pixiTopology}'.`);
    process.exit(1);
}

const importWithTimeout = async (specifier, timeout = 60_000) => {
    let timer;
    try {
        return await Promise.race([
            import(specifier),
            new Promise((_, reject) => {
                timer = setTimeout(
                    () => reject(new Error(`Timed out importing ${specifier}.`)),
                    timeout,
                );
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

const commandDialog = await importWithTimeout('@cratis/components/CommandDialog');
const dataPage = await importWithTimeout('@cratis/components/DataPage');
const notifications = await importWithTimeout('@cratis/components/Notifications');
if (!commandDialog.CommandDialog || !dataPage.DataPage || !notifications.toast) {
    throw new Error('The packed Components surface is incomplete.');
}

for (const forbidden of ['primereact', '@primereact/core', '@primeuix/themes']) {
    try {
        import.meta.resolve(forbidden);
        throw new Error(`Unexpected renderer dependency: ${forbidden}`);
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('Unexpected')) throw error;
    }
}

// Per-area stylesheets (Cratis/Components#301). A CSS subpath is not something Node can `import`,
// so "a consumer can use it" means: the package manager resolves it through the real `exports` map
// to a file that is actually in the installed package and actually contains that area's rules.
// The aggregate is checked the same way, because the split must not have broken it.
const readStylesheet = (specifier) => {
    const resolved = import.meta.resolve(specifier);
    const contents = readFileSync(fileURLToPath(resolved), 'utf8');
    if (contents.length === 0) throw new Error(`${specifier} resolved to an empty file.`);
    return contents;
};

const base = readStylesheet('@cratis/components/styles/base');
if (!base.includes('@layer cratis-theme, cratis-components, cratis-utilities')) {
    throw new Error(
        'The shared style base does not establish the Cratis cascade-layer order.',
    );
}
if (base.includes('.cratis-dialog')) {
    throw new Error('The shared style base leaked component rules into every area.');
}

const aggregate = readStylesheet('@cratis/components/styles');
const dialogArea = readStylesheet('@cratis/components/Dialogs/styles');
if (!dialogArea.includes('.cratis-dialog') || !aggregate.includes('.cratis-dialog')) {
    throw new Error('The Dialogs stylesheet is missing its own rules.');
}
if (dialogArea.includes('.pivot-viewer')) {
    throw new Error('The Dialogs stylesheet pulled in an unrelated area.');
}
if (!aggregate.includes('.pivot-viewer')) {
    throw new Error('The aggregate stylesheet stopped being the whole library.');
}
if (dialogArea.length >= aggregate.length) {
    throw new Error('A per-area stylesheet is no smaller than the aggregate.');
}

const consumerRequire = createRequire(import.meta.url);
const componentsRequire = createRequire(
    import.meta.resolve('@cratis/components/package.json'),
);
const resolvePixi = (resolver) => {
    try {
        return resolver.resolve('pixi.js');
    } catch {
        return undefined;
    }
};
const consumerPixi = resolvePixi(consumerRequire);
const componentsPixi = resolvePixi(componentsRequire);

if (pixiTopology === 'absent') {
    if (consumerPixi || componentsPixi) {
        throw new Error('pixi.js resolved in the declared no-Pixi topology.');
    }
    for (const spatial of [
        '@cratis/components/Canvas',
        '@cratis/components/PivotViewer',
    ]) {
        try {
            await importWithTimeout(spatial);
            throw new Error(`Unexpected spatial import success: ${spatial}`);
        } catch (error) {
            if (error instanceof Error && error.message.startsWith('Unexpected spatial'))
                throw error;
            if (!String(error).includes('pixi.js')) {
                throw new Error(
                    `${spatial} failed for an unexpected reason: ${String(error)}`,
                );
            }
        }
    }
} else {
    if (!consumerPixi || !componentsPixi) {
        throw new Error('pixi.js did not resolve in the Spatial topology.');
    }
    const canonical = (resolved) => {
        try {
            return realpathSync(resolved);
        } catch {
            return resolved;
        }
    };
    if (canonical(consumerPixi) !== canonical(componentsPixi)) {
        throw new Error(
            `Components and its consumer resolved different Pixi instances: ` +
                `${consumerPixi} versus ${componentsPixi}`,
        );
    }
    const canvas = await importWithTimeout('@cratis/components/Canvas');
    const pivotViewer = await importWithTimeout('@cratis/components/PivotViewer');
    if (!canvas.Canvas || !pivotViewer.PivotViewer) {
        throw new Error('The packed Spatial surface is incomplete.');
    }
}

if (pixiTopology === 'present') {
    const pivotArea = readStylesheet('@cratis/components/PivotViewer/styles');
    // PivotViewer renders a FilterPanel, so its derived area closure has to carry Filter's rules.
    if (
        !pivotArea.includes('.pivot-viewer') ||
        !pivotArea.includes('.pv-filter-clear-header')
    ) {
        throw new Error(
            'The PivotViewer stylesheet is missing its derived area closure.',
        );
    }
}

await new Promise((resolve, reject) => {
    process.stdout.write(
        `Packed package-manager consumer verified with Pixi ${pixiTopology}, ` +
            'including the aggregate and per-area stylesheets.\n',
        (error) => (error ? reject(error) : resolve()),
    );
});
process.exit(0);
