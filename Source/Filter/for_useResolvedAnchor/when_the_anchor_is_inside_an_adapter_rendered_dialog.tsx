// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { useResolvedAnchor, type ResolvedAnchor } from '../useResolvedAnchor';

const anchorRef = createRef<HTMLButtonElement>();
let resolved: ResolvedAnchor | null;

const Probe = () => {
    resolved = useResolvedAnchor(anchorRef);
    return <button ref={anchorRef} type='button'>Filters</button>;
};

// An adapter shell such as a native top-layer <dialog>: no built-in class, positioner or backdrop.
describe('when the anchor is inside an adapter-rendered dialog', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => root.render(
            <dialog open data-cratis-part='root' data-cratis-dialog-id='native'>
                <section data-cratis-part='root'><Probe /></section>
            </dialog>,
        ));
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should resolve the anchor', () => {
        expect(resolved?.anchor).to.equal(anchorRef.current);
    });

    it('should resolve the dialog root by its dialog id rather than by its class or part', () => {
        expect(resolved?.modalRoot).to.equal(container.querySelector('dialog'));
    });
});
