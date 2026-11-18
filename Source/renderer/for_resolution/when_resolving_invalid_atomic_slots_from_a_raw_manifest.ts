// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { unstable_defineUiLibrary, type unstable_UiLibrary } from '..';
import { unstable_createRendererLayer, unstable_validateUiLibrary } from '../resolve';
import {
    AdapterPaginator,
    aStablePresentationLibrary,
} from '../for_self_hosting/given/a_stable_presentation_library';

const paginator = (overrides: Record<string, unknown> = {}) => ({
    mode: 'atomic',
    fidelity: 'native',
    render: AdapterPaginator,
    ...overrides,
});

// SAFETY: these manifests deliberately bypass the stable definer, as JavaScript callers can.
const rawLibrary = (atomicSlots: unknown): unstable_UiLibrary =>
    unstable_defineUiLibrary({
        ...aStablePresentationLibrary(),
        atomicSlots,
    } as unknown as unstable_UiLibrary);

const resolvedPaginator = (library: unstable_UiLibrary) =>
    unstable_createRendererLayer(library).slots['datatables.paginator'];

const atomicDiagnostics = (library: unstable_UiLibrary) =>
    unstable_validateUiLibrary(library).filter((diagnostic) =>
        diagnostic.message.startsWith('Invalid stable atomic slot declaration'),
    );

const nonEnumerable = (declaration: object) =>
    Object.defineProperty({}, 'datatables.paginator', { value: declaration, enumerable: false });

describe('when resolving invalid atomic slots from a raw manifest', () => {
    it('should not resolve a paginator with an unstable fidelity and report it', () => {
        const library = rawLibrary({ 'datatables.paginator': paginator({ fidelity: 'garbage' }) });

        expect(resolvedPaginator(library)).to.equal(undefined);
        expect(atomicDiagnostics(library).map((diagnostic) => diagnostic.slotId)).to.deep.equal([
            'datatables.paginator',
        ]);
    });

    it('should not resolve a paginator without a component and report it', () => {
        const library = rawLibrary({ 'datatables.paginator': paginator({ render: undefined }) });

        expect(resolvedPaginator(library)).to.equal(undefined);
        expect(atomicDiagnostics(library)).to.have.lengthOf(1);
    });

    it('should not resolve an inherited paginator and report the map', () => {
        const library = rawLibrary(Object.create({ 'datatables.paginator': paginator() }));

        expect(resolvedPaginator(library)).to.equal(undefined);
        expect(atomicDiagnostics(library)[0]?.message).to.contain('must be a plain object');
    });

    it('should ignore a non-enumerable paginator', () => {
        const library = rawLibrary(nonEnumerable(paginator({ fidelity: 'garbage' })));

        expect(resolvedPaginator(library)).to.equal(undefined);
        expect(atomicDiagnostics(library)).to.deep.equal([]);
    });

    it('should resolve a valid paginator from the generic definer without diagnostics', () => {
        const library = rawLibrary({ 'datatables.paginator': paginator() });

        expect(resolvedPaginator(library)?.render).to.equal(AdapterPaginator);
        expect(atomicDiagnostics(library)).to.deep.equal([]);
    });
});
