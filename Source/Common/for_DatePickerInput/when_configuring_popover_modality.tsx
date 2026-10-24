// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { DatePickerInput } from '../DatePickerInput';
import { CratisComponentsProvider } from '../CratisComponentsProvider';

describe('when configuring popover modality', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        // SAFETY: React's test-environment flag is intentionally absent from DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
    });

    const open = async (isNonModal?: boolean) => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <button type='button' data-outside>
                        Submit
                    </button>
                    <DatePickerInput
                        value={null}
                        onChange={() => undefined}
                        isNonModal={isNonModal}
                    />
                </CratisComponentsProvider>,
            );
        });
        await act(async () =>
            container
                .querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]')!
                .click(),
        );
        return (
            container.querySelector('[data-outside]')!.closest('[aria-hidden="true"]') !==
            null
        );
    };

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should hide outside content from assistive technology by default', async () => {
        (await open()).should.equal(true);
    });

    it('should keep outside content available when non-modal', async () => {
        (await open(true)).should.equal(false);
    });

    it('should retain modal behavior when explicitly requested', async () => {
        (await open(false)).should.equal(true);
    });
});
