// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import type { ComponentType, HTMLAttributes } from 'react';
import { describe, it } from 'vitest';
import type { CratisDialogSlotProps } from '@cratis/components/Dialogs';
import {
    builtInAtomicSlot,
    failedCheckIds,
    passedCheckIds,
    libraryWithAtomicSlot,
    runAtomicSlotConformance,
} from './given/a_stable_atomic_slot_library.js';

// An adapter dialog that owns a native `<dialog>` shell and takes everything else from its host.
const NativeDialog = ({ title, subtitle, isBusy = false, pt, host }: CratisDialogSlotProps) => (
    <dialog
        // SAFETY: the root part's attributes are element-agnostic HTML attributes.
        {...(pt?.root as HTMLAttributes<HTMLDialogElement> | undefined)}
        open
        aria-labelledby={`${host.id}-title`}
        data-cratis-part='root'
        data-open
        onCancel={(event) => {
            event.preventDefault();
            host.dismiss('escape');
        }}
        data-busy={isBusy || undefined}
    >
        <header {...pt?.header} data-cratis-part='header'>
            <h2 {...pt?.title} id={`${host.id}-title`} ref={host.titleRef} data-cratis-part='title'>
                {title}
            </h2>
            {host.hasSubtitle && (
                <p {...pt?.subtitle} id={host.subtitleId} data-cratis-part='subtitle'>
                    {subtitle}
                </p>
            )}
            {host.headerActions}
            <button
                {...pt?.close}
                type='button'
                aria-label={host.closeAriaLabel}
                disabled={isBusy}
                data-cratis-part='close'
                data-disabled={isBusy || undefined}
                data-busy={isBusy || undefined}
                onClick={() => host.dismiss('closeButton')}
            >
                {host.closeIcon}
            </button>
        </header>
        {host.content}
        {host.footer}
        {host.liveRegion}
        <div ref={host.registerOverlayContainer} />
    </dialog>
);

const run = (render: ComponentType<CratisDialogSlotProps>) =>
    runAtomicSlotConformance(libraryWithAtomicSlot('dialogs.dialog', render), 'dialogs.dialog');

// An adapter dialog that renders a close button but ignores Escape.
const IgnoresEscape = ({ title, host }: CratisDialogSlotProps) => (
    <dialog open aria-labelledby={`${host.id}-title`} data-cratis-part='root'>
        <h2 id={`${host.id}-title`} ref={host.titleRef} data-cratis-part='title'>
            {title}
        </h2>
        <button type='button' aria-label={host.closeAriaLabel} data-cratis-part='close' onClick={() => host.dismiss('closeButton')}>
            {host.closeIcon}
        </button>
        {host.content}
        {host.footer}
        <div ref={host.registerOverlayContainer} />
    </dialog>
);

// An adapter dialog that renders its content and footer outside the dialog, so initial focus lands outside it.
const NoInitialFocus = ({ title, host }: CratisDialogSlotProps) => (
    <>
        <dialog open data-cratis-part='root' onCancel={() => host.dismiss('escape')}>
            <h2 data-cratis-part='title'>{title}</h2>
            <button type='button' aria-label={host.closeAriaLabel} data-cratis-part='close' onClick={() => host.dismiss('closeButton')}>
                {host.closeIcon}
            </button>
            <div ref={host.registerOverlayContainer} />
        </dialog>
        {host.content}
        {host.footer}
    </>
);

describe('when running a stable atomic dialog', () => {
    it('should exercise and pass the built-in dialog', async () => {
        const report = await run(builtInAtomicSlot('dialogs.dialog'));

        expect(failedCheckIds(report)).to.deep.equal([]);
    }, 30_000);

    it('should pass an adapter dialog that owns a native dialog shell through its host', async () => {
        const report = await run(NativeDialog);

        expect(failedCheckIds(report)).to.deep.equal([]);
        expect(
            report.checks.find((check) => check.id === 'behavior.dialogs.dialog')?.status,
        ).to.equal('passed');
    }, 30_000);

    it('should report a dialog that renders no parts', async () => {
        const report = await run(() => <div />);

        expect(failedCheckIds(report)).to.include('contract.dialogs.dialog.parts');
    }, 30_000);

    it('should check keyboard, focus and dismissal behavior of the conforming dialog', async () => {
        const report = await run(builtInAtomicSlot('dialogs.dialog'));

        expect(passedCheckIds(report)).to.include.members([
            'behavior.dialogs.dialog.keyboard',
            'behavior.dialogs.dialog.focus',
            'behavior.dialogs.dialog.dismissal',
        ]);
    }, 30_000);

    it('should report a dialog that holds no initial focus', async () => {
        const report = await run(NoInitialFocus);

        expect(failedCheckIds(report)).to.include('behavior.dialogs.dialog.focus');
    }, 30_000);

    it('should report a dialog that ignores Escape', async () => {
        const report = await run(IgnoresEscape);

        expect(failedCheckIds(report)).to.include('behavior.dialogs.dialog.dismissal');
    }, 30_000);
});
