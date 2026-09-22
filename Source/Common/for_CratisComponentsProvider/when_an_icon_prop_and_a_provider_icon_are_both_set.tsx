// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { TagGroup } from '../TagGroup';
import { Dialog } from '../../Dialogs/Dialog';

/**
 * Precedence gate: `per-component prop → provider icon → built-in glyph`. A named prop such as
 * `Dialog.closeIcon` or `TagGroup.removeIcon` addresses one call site, so it keeps winning over a
 * product-wide provider icon, while a sibling site with no prop takes the provider's. The same
 * render proves both halves at once — the two dialogs and two tag groups differ only by the prop.
 */
describe('when an icon prop and a provider icon are both set', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        // SAFETY: React's jsdom act-environment flag is runtime-only and absent from the
        // TypeScript global declaration used by this spec.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider
                    value={{
                        icons: {
                            close: 'PROVIDER-close',
                            remove: 'PROVIDER-remove',
                        },
                    }}
                >
                    <Dialog title='Call-site dialog' closeIcon='CALLSITE-close'>
                        Body
                    </Dialog>
                    <TagGroup
                        value={['alpha']}
                        aria-label='Call-site tags'
                        removeLabel={(entry) => `Remove ${entry}`}
                        removeIcon='CALLSITE-remove'
                    />
                    <TagGroup
                        value={['beta']}
                        aria-label='Product tags'
                        removeLabel={(entry) => `Remove ${entry}`}
                    />
                </CratisComponentsProvider>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should let the dialog close-icon prop win over the provider icon', () => {
        expect(
            document.querySelector('[data-cratis-part="close"]')?.textContent,
        ).to.equal('CALLSITE-close');
    });

    it('should let the tag-group remove-icon prop win over the provider icon', () => {
        const removes = Array.from(
            container.querySelectorAll('.cratis-tag-group__remove'),
        ).map((element) => element.textContent);
        expect(removes[0]).to.equal('CALLSITE-remove');
    });

    it('should use the provider icon for a sibling site that sets no prop', () => {
        const removes = Array.from(
            container.querySelectorAll('.cratis-tag-group__remove'),
        ).map((element) => element.textContent);
        expect(removes[1]).to.equal('PROVIDER-remove');
    });
});
