// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogButtons } from '@cratis/arc.react/dialogs';
import { act, forwardRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import type { ButtonProps } from '../../Common/Button';
import { buttonSlot, createTestLibrary } from '../../renderer/for_resolution/testLibrary';
import { Dialog } from '../Dialog';

const AdapterButton = forwardRef<HTMLButtonElement, ButtonProps>(function AdapterButton(props, ref) {
    const { label, icon, pt, type, disabled, autoFocus, onClick, onKeyDown } = props;
    return (
        <button
            {...pt?.root}
            ref={ref}
            data-adapter='true'
            type={type}
            disabled={disabled}
            aria-disabled={props['aria-disabled']}
            aria-busy={props['aria-busy']}
            autoFocus={autoFocus}
            onClick={onClick}
            onKeyDown={onKeyDown}
        >
            {icon}
            {label}
        </button>
    );
});

const library = createTestLibrary('dialog-adapter', buttonSlot(AdapterButton));

const confirmButton = () => document.querySelector<HTMLButtonElement>('button[data-adapter]')!;

describe('when a dialog becomes busy under a button adapter', () => {
    let container: HTMLDivElement;
    let root: Root;
    let before: HTMLButtonElement;
    let focusedBefore: boolean;

    const renderDialog = (isBusy: boolean) =>
        act(async () => {
            root.render(
                <CratisComponentsProvider library={library}>
                    <Dialog title='Save' buttons={DialogButtons.OkCancel} isBusy={isBusy}>
                        Content
                    </Dialog>
                </CratisComponentsProvider>,
            );
        });

    beforeEach(async () => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        // SAFETY: jsdom omits ResizeObserver; the overlay only calls these observer methods.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        await renderDialog(false);
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 400));
        });
        before = confirmButton();
        focusedBefore = document.activeElement === before;
        await renderDialog(true);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should keep the same confirm element', () => {
        (confirmButton() === before).should.equal(true);
    });

    it('should keep the confirm button focused', () => {
        focusedBefore.should.equal(true);
        (document.activeElement === before).should.equal(true);
    });

    it('should mark the confirm element busy', () => {
        before.getAttribute('aria-busy')!.should.equal('true');
    });
});
