// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, forwardRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import type { ButtonProps } from '../../../Common/Button';
import { buttonSlot, createTestLibrary } from '../../../renderer/for_resolution/testLibrary';
import { DialogFooter, type DialogFooterProps } from '../../DialogFooter';
import { footerProps } from './a_footer';

/** A footer mounted in a document under a fake `common.button` adapter, recording what the adapter received. */
export interface FooterWithAnAdapter {
    container: HTMLDivElement;
    root: Root;
    /** Props of every `common.button` render, in render order. */
    received: ButtonProps[];
    props: DialogFooterProps;
}

/**
 * Mounts a footer whose buttons are rendered by a fake adapter button.
 * @param overrides Footer props overriding the idle OK/Cancel defaults.
 * @returns The mounted footer; pass it to {@link unmountFooter}.
 */
export const mountFooter = async (overrides: Partial<DialogFooterProps> = {}): Promise<FooterWithAnAdapter> => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const received: ButtonProps[] = [];
    const AdapterButton = forwardRef<HTMLButtonElement, ButtonProps>(function AdapterButton(props, ref) {
        received.push(props);
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

    const library = createTestLibrary('footer-adapter', buttonSlot(AdapterButton));
    const footer = footerProps(overrides);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
        root.render(
            <CratisComponentsProvider library={library}>
                <DialogFooter {...footer} />
            </CratisComponentsProvider>,
        );
    });
    return { container, root, received, props: footer };
};

/** Unmounts a footer mounted with {@link mountFooter}. */
export const unmountFooter = async (footer: FooterWithAnAdapter) => {
    await act(async () => footer.root.unmount());
    footer.container.remove();
};

/** The adapter-rendered buttons currently in the document. */
export const adapterButtons = (footer: FooterWithAnAdapter): HTMLButtonElement[] =>
    Array.from(footer.container.querySelectorAll<HTMLButtonElement>('button[data-adapter]'));
