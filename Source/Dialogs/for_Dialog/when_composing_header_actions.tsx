// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import type { DialogHeaderContext } from '../../configuration/DialogHeaderContext';
import { Dialog } from '../Dialog';
import { render, unmount, type DialogInTheDom } from './given/a_dialog_in_the_dom';

const region = () => document.querySelector('[data-cratis-part="header-actions"]');
const names = () =>
    Array.from(region()?.querySelectorAll('button') ?? []).map((button) => button.textContent);

describe('when composing header actions', () => {
    let dialog: DialogInTheDom;
    afterEach(async () => {
        if (dialog) await unmount(dialog);
    });

    describe('and a dialog supplies its own actions', () => {
        beforeEach(async () => {
            dialog = await render(
                <Dialog title='Example dialog' headerActions={<button type='button'>Help</button>}>
                    Body
                </Dialog>,
            );
        });

        it('should render the actions in the header-actions part', () => names().should.deep.equal(['Help']));
        it('should place the region before the close button', () => {
            const header = document.querySelector('[data-cratis-part="header"]')!;
            const parts = Array.from(header.children).map((child) => child.getAttribute('data-cratis-part'));
            parts.indexOf('header-actions').should.be.lessThan(parts.indexOf('close'));
        });
    });

    describe('and no actions are supplied', () => {
        beforeEach(async () => {
            dialog = await render(<Dialog title='Example dialog'>Body</Dialog>);
        });

        it('should not render the region', () => (region() === null).should.be.true);
    });

    describe('and an application registers actions on the provider', () => {
        const contexts: DialogHeaderContext[] = [];
        const renderActions = vi.fn((context: DialogHeaderContext) => {
            contexts.push(context);
            return context.title === 'Hidden dialog' ? null : <button type='button'>Feedback</button>;
        });

        const mount = async (element: React.ReactElement) => {
            contexts.length = 0;
            dialog = await render(
                <CratisComponentsProvider dialogHeaderActions={renderActions}>{element}</CratisComponentsProvider>,
            );
        };

        it('should show the action and hand it the dialog context', async () => {
            await mount(
                <Dialog title='Example dialog' sliceLocation={{ module: 'Example', feature: 'Feature', slice: 'Slice' }}>
                    Body
                </Dialog>,
            );
            names().should.deep.equal(['Feedback']);
            const context = contexts.at(-1)!;
            context.title.should.equal('Example dialog');
            expect(context.isCommandDialog).to.equal(false);
            context.sliceLocation!.should.deep.equal({ module: 'Example', feature: 'Feature', slice: 'Slice' });
            document.querySelector('[role="dialog"]')!.closest('[data-cratis-dialog-id]')!
                .getAttribute('data-cratis-dialog-id')!.should.equal(context.dialogId);
        });

        it('should hide the action when it returns null', async () => {
            await mount(<Dialog title='Hidden dialog'>Body</Dialog>);
            names().should.deep.equal([]);
        });

        it('should render per-dialog actions beside the app-wide ones', async () => {
            await mount(
                <Dialog title='Example dialog' headerActions={<button type='button'>Help</button>}>
                    Body
                </Dialog>,
            );
            names().should.deep.equal(['Help', 'Feedback']);
        });

        it('should suppress the app-wide actions when asked', async () => {
            await mount(
                <Dialog
                    title='Example dialog'
                    hideGlobalHeaderActions
                    headerActions={<button type='button'>Help</button>}
                >
                    Body
                </Dialog>,
            );
            names().should.deep.equal(['Help']);
        });

        it('should let the action use hooks', async () => {
            const Counter = () => {
                const [count] = React.useState(3);
                return <button type='button'>Count {count}</button>;
            };
            dialog = await render(
                <CratisComponentsProvider dialogHeaderActions={() => <Counter />}>
                    <Dialog title='Example dialog'>Body</Dialog>
                </CratisComponentsProvider>,
            );
            names().should.deep.equal(['Count 3']);
        });
    });
});
