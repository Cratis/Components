// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import {
    cratisAtomicSlotIds,
    definePresentationUiLibrary,
    type CratisPresentationUiLibrary,
} from '..';
import {
    AdapterPaginator,
    aStablePresentationLibrary,
    paginatorAtomicSlots,
} from '../for_self_hosting/given/a_stable_presentation_library';

const defineRuntime = definePresentationUiLibrary as (
    library: unknown,
) => CratisPresentationUiLibrary;

const paginator = (overrides: Record<string, unknown> = {}) => ({
    mode: 'atomic',
    fidelity: 'native',
    render: AdapterPaginator,
    ...overrides,
});

const expectRejected = (atomicSlots: unknown, reason: string) =>
    expect(() =>
        defineRuntime({ ...aStablePresentationLibrary(), atomicSlots }),
    ).to.throw(TypeError, `Invalid stable presentation UI library: ${reason}.`);

describe('when defining a presentation library with atomic slots', () => {
    it('should list only the paginator as a stable atomic slot', () => {
        expect(cratisAtomicSlotIds).to.deep.equal(['datatables.paginator']);
        expect(Object.isFrozen(cratisAtomicSlotIds)).to.equal(true);
    });

    it('should freeze a defensive copy of the atomic paginator declaration', () => {
        const input = aStablePresentationLibrary(paginatorAtomicSlots());
        const result = definePresentationUiLibrary(input);

        expect(result.atomicSlots).not.to.equal(input.atomicSlots);
        expect(Object.isFrozen(result.atomicSlots)).to.equal(true);
        expect(Object.isFrozen(result.atomicSlots?.['datatables.paginator'])).to.equal(true);
        expect(result.atomicSlots?.['datatables.paginator']).to.deep.equal({
            mode: 'atomic',
            fidelity: 'native',
            render: AdapterPaginator,
        });
    });

    it('should keep the stable manifest without an atomic slots field when none is supplied', () => {
        const result = definePresentationUiLibrary(aStablePresentationLibrary());

        expect(Object.keys(result)).not.to.include('atomicSlots');
    });

    it('should accept an empty atomic slot map', () => {
        const result = definePresentationUiLibrary(aStablePresentationLibrary({}));

        expect(result.atomicSlots).to.deep.equal({});
    });

    it('should reject an unknown atomic slot id', () => {
        expectRejected(
            { 'dialogs.dialog': paginator() },
            "atomic slot 'dialogs.dialog' is not a stable atomic slot",
        );
    });

    it('should reject presentation mode for an atomic slot', () => {
        expectRejected(
            { 'datatables.paginator': paginator({ mode: 'presentation' }) },
            "atomic slot 'datatables.paginator' must use atomic mode",
        );
    });

    it('should reject unsupported fidelity for an atomic slot', () => {
        expectRejected(
            { 'datatables.paginator': paginator({ fidelity: 'unsupported' }) },
            "atomic slot 'datatables.paginator' must use native or emulated fidelity",
        );
    });

    it('should reject an atomic slot without a component', () => {
        expectRejected(
            { 'datatables.paginator': paginator({ render: undefined }) },
            "atomic slot 'datatables.paginator' must provide a component",
        );
    });

    it('should reject a non-object atomic slot map', () => {
        expectRejected([], 'atomicSlots must be an object when supplied');
    });
});
