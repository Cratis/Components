// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { inventoryDifferences } from '../../../scripts/lib/evidence-inventory.mjs';

export const rendererOptionIdentity = (id, label) => `${id}: ${label}`;

export const verifyRendererOptions = (options, adapters, snapshot) => {
    const actual = options.map(option => rendererOptionIdentity(option.id, option.label));
    const metadata = adapters.map(adapter => rendererOptionIdentity(adapter.metadata.id, adapter.metadata.displayName));
    const metadataDifferences = inventoryDifferences({ publicRendererOptions: metadata }, { publicRendererOptions: actual });
    if (metadataDifferences.length > 0) {
        throw new Error(`Renderer options differ from the validated adapter metadata:\n- ${metadataDifferences.join('\n- ')}`);
    }
    const snapshotDifferences = inventoryDifferences(
        { publicRendererOptions: snapshot.publicRendererOptions },
        { publicRendererOptions: actual },
    );
    if (snapshotDifferences.length > 0) {
        throw new Error(`Renderer options differ from the committed inventory:\n- ${snapshotDifferences.join('\n- ')}\nRun yarn generate-inventories and review the snapshot diff.`);
    }
};
