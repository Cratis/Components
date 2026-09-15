// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { unmountPrimitive } from '../for_Primitives/given/a_primitive_dom';
import {
    listbox,
    mountComboBox,
    options,
    pressComboBoxKey,
    typeIntoComboBox,
    type MountedComboBox,
} from './given/a_combobox';

const loadingMessage = () =>
    document.querySelector<HTMLElement>('[data-cratis-part="loading"]');
const failureMessage = () =>
    document.querySelector<HTMLElement>('[data-cratis-part="failure"]');
const emptyMessage = () =>
    document.querySelector<HTMLElement>('[data-cratis-part="empty"]');

describe('when the options are not ready', () => {
    let mounted: MountedComboBox | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should announce loading instead of options and mark the listbox busy', async () => {
        mounted = await mountComboBox({
            'aria-label': 'Customer',
            loading: true,
            loadingMessage: 'Loading customers…',
        });

        await pressComboBoxKey(mounted, 'ArrowDown');

        expect(mounted.field.getAttribute('data-loading')).to.equal('true');
        expect(loadingMessage()?.getAttribute('aria-busy')).to.equal('true');
        expect(options()).to.have.lengthOf(0);
        expect(loadingMessage()?.getAttribute('role')).to.equal('status');
        expect(loadingMessage()?.textContent).to.equal('Loading customers…');
    });

    it('should replace the options with the failure as an alert', async () => {
        mounted = await mountComboBox({
            'aria-label': 'Customer',
            failure: 'The roster could not be read.',
        });

        await pressComboBoxKey(mounted, 'ArrowDown');

        expect(options()).to.have.lengthOf(0);
        expect(failureMessage()?.getAttribute('role')).to.equal('alert');
        expect(failureMessage()?.textContent).to.equal('The roster could not be read.');
    });

    it('should say when nothing matches', async () => {
        mounted = await mountComboBox({
            'aria-label': 'Customer',
            emptyMessage: 'No customer matches.',
        });

        await pressComboBoxKey(mounted, 'ArrowDown');
        await typeIntoComboBox(mounted, 'zzz');

        expect(options()).to.have.lengthOf(0);
        expect(emptyMessage()?.textContent).to.equal('No customer matches.');
    });

    it('should offer the action after the options and hand it the typed text', async () => {
        const created: string[] = [];
        mounted = await mountComboBox({
            'aria-label': 'Customer',
            action: {
                label: 'Register a new customer',
                onAction: (text) => void created.push(text),
            },
        });

        await pressComboBoxKey(mounted, 'ArrowDown');
        await typeIntoComboBox(mounted, 'Nordic');
        const action = document.querySelector<HTMLElement>('[data-cratis-part="action"]');
        expect(action?.getAttribute('role')).to.equal('option');
        expect(action?.textContent).to.equal('Register a new customer');
        expect(action?.getAttribute('aria-label') ?? action?.textContent).to.equal(
            'Register a new customer',
        );
        expect(listbox()?.lastElementChild).to.equal(action);

        await pressComboBoxKey(mounted, 'ArrowDown');
        await pressComboBoxKey(mounted, 'Enter');

        expect(mounted.actions).to.deep.equal(['Nordic']);
        expect(created).to.deep.equal(['Nordic']);
        expect(mounted.changes).to.deep.equal([]);
    });
});
