// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { createElement, type ComponentType } from 'react';
import {
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    type CratisAtomicSlots,
    type CratisPresentationSlotMap,
    type CratisPresentationUiLibrary,
} from '@cratis/components/renderer';
import { unstable_cratisBuiltIn } from '@cratis/components/renderer/builtin';
import { describe, it } from 'vitest';
import { runConformance } from '../src/index.js';
import { atomicSlots as publishedPaginator } from '../for_slot_contracts/snippets/paginator.js';

type PaginatorProps = CratisAtomicSlots['datatables.paginator'];

// SAFETY: the built-in manifest declares every stable presentation slot with its exact contract.
const builtInPresentationSlots = Object.fromEntries(
    cratisPresentationSlotIds.map((slotId) => [slotId, unstable_cratisBuiltIn.slots[slotId]]),
) as unknown as CratisPresentationSlotMap;

// SAFETY: the built-in paginator declaration implements the exact stable paginator contract.
const BuiltInPaginator = unstable_cratisBuiltIn.slots['datatables.paginator']!
    .render as unknown as ComponentType<PaginatorProps>;

const libraryWithPaginator = (
    render: ComponentType<PaginatorProps>,
): CratisPresentationUiLibrary =>
    definePresentationUiLibrary({
        id: 'stable-atomic-fixture',
        displayName: 'Stable atomic fixture',
        abi: CRATIS_PRESENTATION_ABI_VERSION,
        level: 'primitive',
        profile: CRATIS_PRESENTATION_PROFILE,
        profileSlots: cratisPresentationSlotIds,
        capabilities: ['slot.render', 'parts.passthrough', 'ssr.staticRender'],
        slots: builtInPresentationSlots,
        atomicSlots: {
            'datatables.paginator': { mode: 'atomic', fidelity: 'native', render },
        },
    });

const metadataFor = (library: CratisPresentationUiLibrary) => {
    const slots = [...cratisPresentationSlotIds, 'datatables.paginator'];
    return {
        kind: 'ui-adapter',
        id: library.id,
        displayName: library.displayName,
        abi: `^${library.abi}`,
        level: library.level,
        profile: library.profile,
        category: 'test-fixture',
        entry: './dist/index.js',
        export: 'TestFixture',
        slots,
        modes: {
            ...Object.fromEntries(
                cratisPresentationSlotIds.map((slotId) => [slotId, 'presentation']),
            ),
            'datatables.paginator': 'atomic',
        },
        capabilities: [...library.capabilities],
        ssr: 'safe',
        a11y: { axeProfile: 'wcag21aa', evidence: './CONFORMANCE.md' },
        license: { spdx: 'MIT', requiresKey: false },
        upstream: { react: '^19.0.0' },
    } as const;
};

const run = (library: CratisPresentationUiLibrary) =>
    runConformance(library, { metadata: metadataFor(library), document, axe: false });

const failedIds = (report: Awaited<ReturnType<typeof run>>) =>
    report.checks.filter((check) => check.status === 'failed').map((check) => check.id);

// An adapter paginator whose controls swallow every key press, so only a pointer can page.
const KeyboardSuppressed = (props: PaginatorProps) => {
    const Published = publishedPaginator['datatables.paginator'].render;
    return (
        <div onKeyDownCapture={(event) => event.preventDefault()}>
            <Published {...props} />
        </div>
    );
};

describe('when running a stable atomic paginator', () => {
    it('should exercise and pass a conforming adapter paginator', async () => {
        const report = await run(libraryWithPaginator(BuiltInPaginator));

        expect(failedIds(report)).to.deep.equal([]);
        expect(
            report.checks.find((check) => check.id === 'behavior.datatables.paginator')
                ?.status,
        ).to.equal('passed');
    }, 30_000);

    it('should report a paginator that never reports page changes', async () => {
        const Silent = (props: PaginatorProps) =>
            createElement(BuiltInPaginator, { ...props, onPageChange: () => undefined });

        const report = await run(libraryWithPaginator(Silent));

        expect(failedIds(report)).to.include('behavior.datatables.paginator');
    }, 30_000);

    it('should pass a paginator of native buttons that page from the keyboard', async () => {
        const report = await run(libraryWithPaginator(publishedPaginator['datatables.paginator'].render));

        expect(failedIds(report).filter((id) => id.startsWith('behavior.'))).to.deep.equal([]);
    }, 30_000);

    it('should report a paginator whose controls cannot be activated from the keyboard', async () => {
        const report = await run(libraryWithPaginator(KeyboardSuppressed));

        expect(failedIds(report)).to.include('behavior.datatables.paginator.keyboard');
    }, 30_000);

    it('should check keyboard and focus behavior of the conforming paginator', async () => {
        const report = await run(libraryWithPaginator(BuiltInPaginator));
        const passed = report.checks.filter((check) => check.status === 'passed').map((check) => check.id);

        expect(passed).to.include.members([
            'behavior.datatables.paginator.keyboard',
            'behavior.datatables.paginator.focus',
        ]);
    }, 30_000);
});
