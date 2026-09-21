// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Tabs } from '../Tabs';
import {
    mountPrimitive,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

const tabs = [
    { id: 'open', label: 'Open', content: 'Open requests' },
    { id: 'closed', label: 'Closed', content: 'Closed requests' },
    { id: 'draft', label: 'Draft', content: 'Drafts', disabled: true },
];

const Harness = ({ onValue }: { onValue: (value: string) => void }) => {
    const [value, setValue] = useState('open');
    return (
        <Tabs
            tabs={tabs}
            value={value}
            aria-label='Requests'
            onChange={(next) => {
                setValue(next);
                onValue(next);
            }}
        />
    );
};

const press = async (element: Element, key: string) => {
    await act(async () => {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
        await Promise.resolve();
    });
};

describe('when moving between tabs', () => {
    let mounted: MountedPrimitive;
    const chosen: string[] = [];
    const tabElements = () =>
        Array.from(mounted.container.querySelectorAll<HTMLElement>('[data-cratis-part="tab"]'));

    beforeEach(async () => {
        chosen.length = 0;
        mounted = await mountPrimitive(<Harness onValue={(value) => chosen.push(value)} />);
    });

    afterEach(async () => {
        await unmountPrimitive(mounted);
    });

    it('should carry tab-list semantics naming the set', () => {
        const list = mounted.container.querySelector('[data-cratis-part="list"]');
        expect(list?.getAttribute('role')).to.equal('tablist');
        expect(list?.getAttribute('aria-label')).to.equal('Requests');
        expect(tabElements().map((tab) => tab.getAttribute('role'))).to.deep.equal([
            'tab',
            'tab',
            'tab',
        ]);
    });

    it('should point the selected tab at its panel', () => {
        const [selected] = tabElements();
        const panel = mounted.container.querySelector('[data-cratis-part="panel"]');
        expect(selected.getAttribute('aria-selected')).to.equal('true');
        expect(selected.getAttribute('aria-controls')).to.equal(panel?.id);
        expect(panel?.getAttribute('role')).to.equal('tabpanel');
        expect(panel?.textContent).to.equal('Open requests');
    });

    it('should select the next tab with the arrow keys', async () => {
        await press(tabElements()[0], 'ArrowRight');
        expect(chosen).to.deep.equal(['closed']);
    });

    it('should skip a disabled tab', async () => {
        await press(tabElements()[0], 'End');
        expect(chosen).to.deep.equal(['closed']);
    });

    it('should hold one tab stop for the whole list', () => {
        expect(tabElements().filter((tab) => tab.tabIndex === 0)).to.have.lengthOf(1);
    });
});
