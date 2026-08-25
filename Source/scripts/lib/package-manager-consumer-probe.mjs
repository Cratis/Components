// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Runs inside a package-manager-created consumer after the packed Components artifact and its
 * mandatory peers have been installed. Argument 1 is `absent` or `present` for the Pixi topology.
 */

import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';

const pixiTopology = process.argv[2];
if (pixiTopology !== 'absent' && pixiTopology !== 'present') {
    console.error(`Expected Pixi topology 'absent' or 'present'; got '${pixiTopology}'.`);
    process.exit(1);
}

const commandDialog = await import('@cratis/components/CommandDialog');
const dataPage = await import('@cratis/components/DataPage');
const notifications = await import('@cratis/components/Notifications');
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
            await import(spatial);
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
    const canvas = await import('@cratis/components/Canvas');
    const pivotViewer = await import('@cratis/components/PivotViewer');
    if (!canvas.Canvas || !pivotViewer.PivotViewer) {
        throw new Error('The packed Spatial surface is incomplete.');
    }
}

console.log(`Packed package-manager consumer verified with Pixi ${pixiTopology}.`);
