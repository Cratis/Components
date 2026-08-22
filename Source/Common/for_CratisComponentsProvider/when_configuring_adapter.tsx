// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { PrimeReactProps } from '@primereact/types/core';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock('@primereact/core', () => ({
    PrimeReactProvider: (props: Record<string, unknown>) => {
        captured.props = props;
        return props.children;
    },
}));

import {
    CratisComponentsProvider,
    type CratisComponentsConfig,
} from '../CratisComponentsProvider';

const previouslyTypedConfig: Partial<PrimeReactProps> = {
    locales: { test: { today: 'Today' } },
    pt: { button: { root: { className: 'button' } } },
    theme: { preset: {}, options: {} },
};
const sourceCompatibleConfig: CratisComponentsConfig = previouslyTypedConfig;

describe('when configuring the rendering adapter', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
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
                        ...sourceCompatibleConfig,
                        adapter: {
                            customOption: 'adapter-value',
                            ripple: false,
                        },
                        license: 'primeui-key',
                        ripple: true,
                    }}
                >
                    <div>Content</div>
                </CratisComponentsProvider>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should forward low-level adapter options', () => {
        expect(captured.props.customOption).to.equal('adapter-value');
    });

    it('should let named Cratis options override adapter values', () => {
        expect(captured.props.ripple).to.equal(true);
    });

    it('should forward the documented PrimeUI license', () => {
        expect(captured.props.license).to.equal('primeui-key');
    });

    it('should not leak the adapter envelope to the rendering provider', () => {
        expect(captured.props.adapter).to.equal(undefined);
    });
});
