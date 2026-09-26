// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { DialogButtons, DialogComponents, DialogResult, useConfirmationDialog } from '@cratis/arc.react/dialogs';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { ConfirmationDialog } from '../../Dialogs/ConfirmationDialog';
import { render, click, unmount, type DialogInTheDom } from '../../Dialogs/for_Dialog/given/a_dialog_in_the_dom';
import { resolveZIndex } from '../../renderer/for_dialog_stack/resolveZIndex';
import { CommandDialog } from '../CommandDialog';

const execution = vi.hoisted(() => ({ calls: 0 }));
vi.mock('@cratis/arc.react/commands', () => {
    const command = { name: 'Example', execute: async () => { execution.calls++; return { isSuccess: true, response: {} }; } };
    const context = { isValid: true, setCommandValues: () => undefined, setCommandResult: () => undefined };
    return {
        CommandForm: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
        useCommandFormContext: () => context,
        useCommandInstance: () => command,
        CommandFormFieldWrapper: () => null,
    };
});
class SampleCommand { name = 'Example'; }

const CommandWithConfirmation = () => {
    const [showConfirmation] = useConfirmationDialog('Run command?', 'Continue?', DialogButtons.YesNo);
    return (
        <CommandDialog<SampleCommand> command={SampleCommand} title='Example command' onConfirm={() => false}
            confirmBeforeExecute={async () => (await showConfirmation()) === DialogResult.Yes} />
    );
};

describe('when a confirmation dialog opens above a command dialog', () => {
    let dialog: DialogInTheDom;
    let firstZIndex: number;
    let secondZIndex: number;
    let callsAfterDecline: number;
    let dialogsAfterDecline: number;
    beforeEach(async () => {
        execution.calls = 0;
        document.documentElement.style.setProperty('--cratis-z-index-dialog', '1100');
        dialog = await render(
            <DialogComponents confirmation={ConfirmationDialog}>
                <CommandWithConfirmation />
            </DialogComponents>,
        );
        await click('Ok');
        const backdrops = Array.from(document.querySelectorAll('.cratis-dialog__backdrop[data-cratis-part="backdrop"]')) as HTMLElement[];
        firstZIndex = resolveZIndex(backdrops[0]);
        secondZIndex = resolveZIndex(backdrops[1]);
        await click('No');
        callsAfterDecline = execution.calls;
        dialogsAfterDecline = document.querySelectorAll('[role="dialog"]').length;
        await click('Ok');
        await click('Yes');
    });
    afterEach(async () => {
        document.documentElement.style.removeProperty('--cratis-z-index-dialog');
        await unmount(dialog);
    });
    it('should stack confirmation above the command dialog', () => { (secondZIndex > firstZIndex).should.equal(true); });
    it('should leave the command dialog open without executing on No', () => {
        callsAfterDecline.should.equal(0);
        dialogsAfterDecline.should.equal(1);
    });
    it('should execute only after Yes', () => { execution.calls.should.equal(1); });
});
