// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { TablePaginator, type TablePaginatorProps } from '../../DataTables/TablePaginator';
import { unstable_cratisBuiltIn } from '../builtin';
import {
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    type CratisPresentationSlotMap,
    unstable_composeUiLibraries,
    unstable_RendererScope,
    type unstable_UiLibrary,
} from '..';
import { buttonSlot, createTestLibrary, FirstButton } from '../for_resolution/testLibrary';
import {
    aStablePresentationLibrary,
    paginatorAtomicSlots,
} from './given/a_stable_presentation_library';

const RendererScope = unstable_RendererScope;

// SAFETY: the built-in manifest declares every stable presentation slot with its exact contract.
const builtInPresentationSlots = Object.fromEntries(
    cratisPresentationSlotIds.map((slotId) => [slotId, unstable_cratisBuiltIn.slots[slotId]]),
) as unknown as CratisPresentationSlotMap;

const paginator = <TablePaginator page={1} pageCount={3} onPageChange={() => undefined} />;

const renderWith = (library?: unstable_UiLibrary | readonly unstable_UiLibrary[]) =>
    renderToStaticMarkup(
        <CratisComponentsProvider library={library}>{paginator}</CratisComponentsProvider>,
    );

const LaterPaginator = ({ page }: TablePaginatorProps) => <nav data-later-paginator={page} />;

const laterPaginator = () =>
    createTestLibrary('later', {
        'datatables.paginator': { mode: 'atomic', fidelity: 'native', render: LaterPaginator },
    });

const withPaginator = () =>
    definePresentationUiLibrary(aStablePresentationLibrary(paginatorAtomicSlots()));

describe('when resolving a stable atomic paginator', () => {
    it('should render the adapter paginator with the zero-based contract', () => {
        const html = renderWith(withPaginator());

        expect(html).to.equal('<nav data-adapter-paginator="1/3"></nav>');
    });

    it('should render the adapter paginator inside a renderer scope', () => {
        const html = renderToStaticMarkup(
            <CratisComponentsProvider>
                <RendererScope use={withPaginator()}>{paginator}</RendererScope>
            </CratisComponentsProvider>,
        );

        expect(html).to.equal('<nav data-adapter-paginator="1/3"></nav>');
    });

    it('should keep the adapter paginator when a later library overrides other slots', () => {
        const html = renderWith(
            unstable_composeUiLibraries(
                withPaginator(),
                createTestLibrary('buttons', buttonSlot(FirstButton)),
            ),
        );

        expect(html).to.equal('<nav data-adapter-paginator="1/3"></nav>');
    });

    it('should keep the built-in paginator when the library has no atomic slots', () => {
        const withoutAtomicSlots = definePresentationUiLibrary(aStablePresentationLibrary());
        const withEmptyAtomicSlots = definePresentationUiLibrary(aStablePresentationLibrary({}));

        const html = renderWith(withoutAtomicSlots);

        expect(html).not.to.contain('data-adapter-paginator');
        expect(html).to.contain('aria-label="Pagination"');
        expect(renderWith(withEmptyAtomicSlots)).to.equal(html);
    });

    it('should render the default paginator when the library has no atomic slots', () => {
        const library = definePresentationUiLibrary({
            ...aStablePresentationLibrary(),
            slots: builtInPresentationSlots,
        });

        expect(renderWith(library)).to.equal(renderWith());
    });

    it('should let a later generic library override the stable paginator', () => {
        const html = renderWith(unstable_composeUiLibraries(withPaginator(), laterPaginator()));

        expect(html).to.equal('<nav data-later-paginator="1"></nav>');
    });

    it('should let a later stable library override a generic paginator', () => {
        const html = renderWith(unstable_composeUiLibraries(laterPaginator(), withPaginator()));

        expect(html).to.equal('<nav data-adapter-paginator="1/3"></nav>');
    });
});
