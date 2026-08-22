// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { components3PrimeReact11PassThroughContract } from './components3PrimeReact11PassThroughContract';
import type { PrimeReact11PassThroughComponent } from './PrimeReact11PassThroughComponent';
import { primeReact11PassThroughSentinelAttribute } from './primeReact11PassThroughSentinelPreset';

type RenderedMarker = {
    readonly scope: string;
    readonly part?: string;
};

const markerSelector = (marker: RenderedMarker) =>
    marker.part
        ? `[data-scope="${marker.scope}"][data-part="${marker.part}"]`
        : `[data-scope="${marker.scope}"]`;

const containsSelector = (root: ParentNode, selector: string) => {
    const possibleElement = root as ParentNode & {
        matches?: (candidate: string) => boolean;
    };
    return (
        possibleElement.matches?.(selector) === true ||
        root.querySelector(selector) !== null
    );
};

/**
 * Asserts that rendered PrimeReact 11 output still honors the Components 3 pass-through contract.
 *
 * Render the components under {@link primeReact11PassThroughSentinelPreset} before calling this
 * function. Pass a component list to check only the primitives your application uses. Additional
 * slots and markers are ignored so additive PrimeReact changes remain compatible.
 *
 * @throws Error with one diagnostic per missing slot or structural marker.
 */
export const assertPrimeReact11PassThroughCompatibility = (
    root: ParentNode,
    components: readonly PrimeReact11PassThroughComponent[] = Object.keys(
        components3PrimeReact11PassThroughContract.components,
    ) as PrimeReact11PassThroughComponent[],
): void => {
    const diagnostics: string[] = [];

    for (const component of components) {
        const contract = components3PrimeReact11PassThroughContract.components[component];

        for (const slot of contract.slots) {
            const sentinel = `${component}.${slot}`;
            if (
                !containsSelector(
                    root,
                    `[${primeReact11PassThroughSentinelAttribute}~="${sentinel}"]`,
                )
            ) {
                diagnostics.push(
                    `${component}.${slot}: pass-through sentinel was not rendered; ` +
                        'the slot may have been removed, renamed, or omitted from the compatibility fixture.',
                );
            }
        }

        for (const marker of contract.renderedMarkers) {
            const selector = markerSelector(marker);
            if (!containsSelector(root, selector)) {
                diagnostics.push(
                    `${component} marker ${selector}: structural marker was not rendered; ` +
                        'it may have been removed, renamed, or omitted from the compatibility fixture.',
                );
            }
        }
    }

    if (diagnostics.length > 0) {
        throw new Error(
            `PrimeReact 11 pass-through compatibility failed for @cratis/components major 3 ` +
                `(${components3PrimeReact11PassThroughContract.id}):\n- ${diagnostics.join('\n- ')}`,
        );
    }
};
