// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { vi } from 'vitest';
import {
    render,
    unmount,
    type DialogInTheDom,
} from '../../Dialogs/for_Dialog/given/a_dialog_in_the_dom';
import { CommandDialog } from '../CommandDialog';

const { receivedFormProps } = vi.hoisted(() => ({ receivedFormProps: vi.fn() }));

vi.mock('@cratis/arc.react/commands', async () => {
    const actual = await vi.importActual<Record<string, unknown>>('@cratis/arc.react/commands');
    return {
        ...actual,
        CommandForm: (props: { children?: React.ReactNode }) => {
            receivedFormProps(props);
            return React.createElement('div', null, props.children);
        },
        useCommandFormContext: () => ({
            isValid: true,
            setCommandValues: () => {},
            setCommandResult: () => {},
        }),
        useCommandInstance: () => ({}),
    };
});

class TestCommand {
    name: string = '';
}

describe('when dialog presentation is configured on a command dialog', () => {
    let dialog: DialogInTheDom;

    const renderDialog = async () => {
        dialog = await render(
            React.createElement(CommandDialog<TestCommand>, {
                command: TestCommand,
                title: 'Example Project',
                subtitle: 'Project details',
                placement: 'end',
                closeIcon: React.createElement('span', null, 'Close example'),
            }, React.createElement('p', null, 'Body')),
        );
    };

    afterEach(async () => {
        if (dialog) await unmount(dialog);
    });

    it('should render the subtitle as the dialog description', async () => {
        await renderDialog();

        (document.querySelector('[data-cratis-part="subtitle"]')?.textContent ?? '').should.equal('Project details');
    });

    it('should place the dialog at the requested edge', async () => {
        await renderDialog();

        (document.querySelector('[data-cratis-part="positioner"]')?.getAttribute('data-placement') ?? '').should.equal('end');
    });

    it('should render the custom close icon', async () => {
        await renderDialog();

        (document.querySelector('[data-cratis-part="close"]')?.textContent ?? '').should.equal('Close example');
    });

    it('should not send dialog-only props to the command form', async () => {
        await renderDialog();

        const formProps = receivedFormProps.mock.lastCall?.[0] as Record<string, unknown>;
        Object.hasOwn(formProps, 'subtitle').should.be.false;
        Object.hasOwn(formProps, 'placement').should.be.false;
        Object.hasOwn(formProps, 'closeIcon').should.be.false;
    });
});
