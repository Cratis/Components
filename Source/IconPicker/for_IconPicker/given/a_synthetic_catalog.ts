// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createElement } from 'react';
import type { IconPickerCatalog } from '../../IconPickerCatalog';
import type { IconPickerEntry } from '../../IconPickerEntry';
import type { IconPickerLibrary } from '../../IconPickerLibrary';

/** Every preview the catalog has rendered, so specs can tell lazily drawn glyphs from skipped ones. */
export const renderedPreviews: string[] = [];

export const exampleGlyphs: IconPickerLibrary = {
    id: 'example-glyphs',
    name: 'Example Glyphs',
    version: '1.2.0',
    attribution: 'Synthetic glyphs for examples',
};

export const sampleSymbols: IconPickerLibrary = { id: 'sample-symbols', name: 'Sample Symbols' };

/**
 * Builds a synthetic catalog entry. Nothing here comes from a real icon set.
 * @param library The library id.
 * @param key The key within the library.
 * @param name The display name.
 * @param categories The categories to list it under.
 * @param extra Further entry fields.
 * @returns The entry.
 */
export const entry = (
    library: string,
    key: string,
    name: string,
    categories: string[],
    extra: Partial<IconPickerEntry> = {},
): IconPickerEntry => ({
    library,
    key,
    name,
    categories,
    renderPreview: () => {
        renderedPreviews.push(`${library}/${key}`);
        return createElement('svg', { 'data-glyph': `${library}/${key}` });
    },
    ...extra,
});

/** Two libraries that both define a `home` icon, plus a few others to browse. */
export const twoLibraryCatalog = (): IconPickerCatalog => ({
    libraries: [exampleGlyphs, sampleSymbols],
    icons: [
        entry('example-glyphs', 'home', 'Home', ['Places'], { tags: ['house', 'start'] }),
        entry('example-glyphs', 'map', 'Map', ['Places']),
        entry('example-glyphs', 'arrow-left', 'Arrow left', ['Arrows'], { aliases: ['back'] }),
        entry('example-glyphs', 'arrow-right', 'Arrow right', ['Arrows']),
        entry('example-glyphs', 'plain', 'Plain glyph', []),
        entry('sample-symbols', 'home', 'Home', ['Places']),
        entry('sample-symbols', 'gear', 'Gear', ['Tools'], { tags: ['settings', 'cog'] }),
        entry('sample-symbols', 'gear', 'Gear outline', ['Tools'], { variant: 'outline' }),
        entry('sample-symbols', 'old', 'Old symbol', ['Tools'], { deprecated: true }),
    ],
});

/** One library, so no provider is named. */
export const oneLibraryCatalog = (): IconPickerCatalog => ({
    libraries: [exampleGlyphs],
    icons: twoLibraryCatalog().icons.filter(icon => icon.library === 'example-glyphs'),
});
