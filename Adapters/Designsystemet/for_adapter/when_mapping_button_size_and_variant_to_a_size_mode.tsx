// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { designsystemetUiLibrary } from '../src/index.js';

type SlotId = keyof typeof designsystemetUiLibrary.slots;

const cratisVariants = ['solid', 'outline', 'ghost', 'link'];

const renderInsideSizeMode = (slotId: SlotId, props: Readonly<Record<string, unknown>>) => {
    const declaration = designsystemetUiLibrary.slots[slotId];
    if (!declaration) throw new Error(`Missing ${slotId} declaration.`);
    // SAFETY: Fixture props are paired with the corresponding public slot contract.
    const Component = declaration.render as unknown as ComponentType<Record<string, unknown>>;
    const host = document.createElement('div');
    host.innerHTML = `<div data-size="lg" data-color-scheme="dark">${renderToStaticMarkup(createElement(Component, props))}</div>`;
    return host.firstElementChild as HTMLElement;
};

const fixtures: readonly (readonly [SlotId, Record<string, unknown>])[] = [
    ['common.button', { label: 'Save', size: 'large', tone: 'critical', variant: 'outline' }],
    ['common.iconButton', { icon: '+', 'aria-label': 'Add', size: 'small' }],
    ['common.textInput', { 'aria-label': 'Name' }],
    ['common.textArea', { 'aria-label': 'Notes' }],
    ['common.checkbox', { label: 'Selected' }],
    ['common.radio', { label: 'Daily', name: 'f', value: 'd' }],
    ['common.switch', { label: 'Enabled' }],
    ['common.progress', { value: 10 }],
    ['common.surface', { as: 'section' }],
];

describe('when mapping button size and variant to a size mode', () => {
    it('should leave the size unset for a normal button so the ambient size mode applies', () => {
        const root = renderInsideSizeMode('common.button', { label: 'Save', size: 'normal' });
        const button = root.querySelector('button');
        expect(button?.hasAttribute('data-size')).to.equal(false);
    });

    it('should map small and large to Designsystemet size modes', () => {
        const small = renderInsideSizeMode('common.button', { label: 'Save', size: 'small' });
        const large = renderInsideSizeMode('common.button', { label: 'Save', size: 'large' });
        expect(small.querySelector('button')?.getAttribute('data-size')).to.equal('sm');
        expect(large.querySelector('button')?.getAttribute('data-size')).to.equal('lg');
    });

    for (const [variant, expected] of [
        ['solid', 'primary'],
        ['outline', 'secondary'],
        ['ghost', 'tertiary'],
        ['link', 'tertiary'],
    ] as const) {
        it(`should map the ${variant} variant to ${expected}`, () => {
            const root = renderInsideSizeMode('common.button', { label: 'Save', variant });
            expect(root.querySelector('button')?.getAttribute('data-variant')).to.equal(expected);
        });
    }

    for (const [tone, expected] of [
        ['neutral', 'neutral'],
        ['accent', 'accent'],
        ['positive', 'success'],
        ['caution', 'warning'],
        ['critical', 'danger'],
    ] as const) {
        it(`should map the ${tone} tone to data-color ${expected}`, () => {
            const root = renderInsideSizeMode('common.button', { label: 'Save', tone });
            expect(root.querySelector('button')?.getAttribute('data-color')).to.equal(expected);
        });
    }

    it('should set no data-color for a button without a tone', () => {
        const root = renderInsideSizeMode('common.button', { label: 'Save' });
        expect(root.querySelector('button')?.hasAttribute('data-color')).to.equal(false);
    });

    for (const [slotId, props] of fixtures) {
        it(`should not let ${slotId} override the surrounding size mode or color scheme`, () => {
            const root = renderInsideSizeMode(slotId, props);
            expect(root.getAttribute('data-size')).to.equal('lg');
            expect(root.getAttribute('data-color-scheme')).to.equal('dark');
            for (const element of root.querySelectorAll('[data-size]')) {
                expect(['sm', 'md', 'lg']).to.include(element.getAttribute('data-size'));
            }
        });

        it(`should not leak a Cratis variant value from ${slotId} into data-variant`, () => {
            const root = renderInsideSizeMode(slotId, props);
            for (const element of root.querySelectorAll('[data-variant]')) {
                expect(cratisVariants).not.to.include(element.getAttribute('data-variant'));
            }
        });
    }
});
