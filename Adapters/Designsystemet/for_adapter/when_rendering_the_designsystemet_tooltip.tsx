// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { act, createElement, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '@cratis/components';
import { Tooltip, type TooltipProps } from '@cratis/components/Common';
import { designsystemetUiLibrary } from '../src/index.js';

let root: Root | undefined;
let container: HTMLElement | undefined;

const render = async (props: Partial<TooltipProps>, ref?: ReturnType<typeof createRef<HTMLButtonElement>>) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root?.render(
            createElement(CratisComponentsProvider, {
                library: designsystemetUiLibrary,
                children: createElement(
                    Tooltip,
                    {
                        content: createElement('span', null, 'Save ', createElement('strong', null, 'changes')),
                        children: createElement('button', { type: 'button', ref, className: 'sample' }, 'Save'),
                        ...props,
                    },
                ),
            }),
        );
    });
};

const trigger = () => container?.querySelector<HTMLButtonElement>('button') as HTMLButtonElement;
const popup = () => document.querySelector<HTMLElement>('[data-cratis-part="popup"]');

afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
});

describe('when rendering the Designsystemet tooltip', () => {
    it('should render node content in a popup that describes the focused trigger only while open', async () => {
        await render({ className: 'extra' });
        expect(trigger().getAttribute('data-cratis-part')).to.equal('trigger');
        expect(trigger().classList.contains('extra')).to.equal(true);
        expect(trigger().hasAttribute('aria-describedby')).to.equal(false);
        expect(popup()).to.equal(null);

        await act(async () => trigger().focus());

        expect(popup()?.getAttribute('role')).to.equal('tooltip');
        expect(popup()?.querySelector('strong')?.textContent).to.equal('changes');
        expect(trigger().getAttribute('aria-describedby')).to.equal(popup()?.id);
    });

    it('should open on hover and close on mouse leave, blur and Escape', async () => {
        await render({});
        const mouse = (type: string) => trigger().dispatchEvent(new MouseEvent(type, { bubbles: true }));

        await act(async () => mouse('mouseover'));
        expect(popup()).not.to.equal(null);
        await act(async () => mouse('mouseout'));
        expect(popup()).to.equal(null);

        await act(async () => trigger().focus());
        await act(async () => trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
        expect(popup()).to.equal(null);

        await act(async () => trigger().focus());
        await act(async () => trigger().blur());
        expect(popup()).to.equal(null);
    });

    it('should return the trigger unchanged for empty content or when disabled', async () => {
        for (const props of [{ content: '' }, { content: null }, { content: false }, { disabled: true }] as const) {
            await render(props);
            expect(trigger().hasAttribute('data-cratis-part'), JSON.stringify(props)).to.equal(false);
            expect(trigger().className).to.equal('sample');
            await act(async () => root?.unmount());
            container?.remove();
        }
    });

    it('should keep the trigger ref and place the popup next to the trigger', async () => {
        const ref = createRef<HTMLButtonElement>();
        await render({ position: 'bottom' }, ref);
        expect(ref.current).to.equal(trigger());

        await act(async () => trigger().focus());

        expect(popup()?.style.position).to.equal('fixed');
        expect(popup()?.style.transform).to.equal('translateX(-50%)');
    });
});
