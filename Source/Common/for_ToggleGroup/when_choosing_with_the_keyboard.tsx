// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { ToggleGroup } from '../ToggleGroup';
import {
    mountPrimitive,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

const options = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
];

const Harness = ({ onValue }: { onValue: (value: string) => void }) => {
    const [value, setValue] = useState('day');
    return (
        <ToggleGroup
            options={options}
            value={value}
            aria-label='Period'
            onChange={(next) => {
                setValue(next);
                onValue(next);
            }}
        />
    );
};

const focus = async (element: HTMLElement) => {
    await act(async () => {
        element.focus();
        element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await Promise.resolve();
    });
};

const press = async (element: Element, key: string) => {
    await act(async () => {
        element.dispatchEvent(
            new KeyboardEvent('keydown', { key, code: key, bubbles: true }),
        );
        element.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, bubbles: true }));
    });
};

describe('when choosing with the keyboard', () => {
    let mounted: MountedPrimitive;
    const chosen: string[] = [];

    beforeEach(async () => {
        chosen.length = 0;
        mounted = await mountPrimitive(<Harness onValue={(value) => chosen.push(value)} />);
    });

    afterEach(async () => {
        await unmountPrimitive(mounted);
    });

    it('should be a radio group rather than a tab list', () => {
        const group = mounted.container.querySelector('[data-cratis-part="root"]');
        expect(group?.getAttribute('role')).to.equal('radiogroup');
        expect(group?.getAttribute('aria-label')).to.equal('Period');
    });

    it('should expose each option as a radio carrying its checked state', () => {
        const radios = Array.from(
            mounted.container.querySelectorAll('[data-cratis-part="option"]'),
        );
        expect(radios.map((radio) => radio.getAttribute('role'))).to.deep.equal([
            'radio',
            'radio',
            'radio',
        ]);
        expect(radios.map((radio) => radio.getAttribute('aria-checked'))).to.deep.equal([
            'true',
            'false',
            'false',
        ]);
    });

    // React Aria moves focus with the arrows and commits with Space or Enter, rather than selecting
    // on focus. Both are permitted for a radio group, and focus-then-activate is the safer one here:
    // a segmented control often drives a query, so arrowing past an option must not run it.
    it('should move focus with the arrow keys without selecting', async () => {
        const [first] = Array.from(
            mounted.container.querySelectorAll<HTMLElement>('[data-cratis-part="option"]'),
        );
        await focus(first);
        await press(document.activeElement!, 'ArrowRight');

        expect((document.activeElement as HTMLElement).textContent).to.equal('Week');
        expect(chosen).to.deep.equal([]);
    });

    it('should commit the focused option with Space', async () => {
        const [first] = Array.from(
            mounted.container.querySelectorAll<HTMLElement>('[data-cratis-part="option"]'),
        );
        await focus(first);
        await press(document.activeElement!, 'ArrowRight');
        await press(document.activeElement!, ' ');

        expect(chosen).to.deep.equal(['week']);
        expect(
            mounted.container
                .querySelectorAll('[data-cratis-part="option"]')[1]
                .getAttribute('aria-checked'),
        ).to.equal('true');
    });
});
