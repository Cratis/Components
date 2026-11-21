// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { beforeEach, describe, it } from 'vitest';
import type { CommandValidationResults } from '../validationFeedback';
import { validationRefusalFeedback } from '../validationFeedback';
import type { DialogRefusalFeedback } from '../../Dialogs/DialogRefusalFeedback';

const results = (...messages: string[]) =>
    messages.map((message) => ({ message, members: [] })) as unknown as CommandValidationResults;

describe('when describing a validation refusal', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = '<div aria-invalid="true"><span>Label</span><input id="inner" /></div><input id="later" aria-invalid="true" />';
    });

    describe('with a single problem', () => {
        let feedback: DialogRefusalFeedback | undefined;
        beforeEach(() => (feedback = validationRefusalFeedback(results('Name is required'), container)));

        it('should announce the one problem', () => expect(feedback?.message).to.equal('There is 1 problem. Name is required'));
        it('should focus the first focusable element inside the first invalid wrapper', () =>
            expect(feedback?.focus?.id).to.equal('inner'));
    });

    describe('with no validation results', () => {
        it('should give no feedback', () => expect(validationRefusalFeedback(results(), container)).to.equal(undefined));
    });

    describe('with no invalid field in the dialog', () => {
        it('should leave the focus target to the dialog', () =>
            expect(validationRefusalFeedback(results('Name is required'), document.createElement('div'))?.focus).to.equal(undefined));
    });
});
