// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { AutoCommandForm } from '../AutoCommandForm';
import { SampleCommand } from './given/SampleCommand';

describe('when rendering the default generated field components', () => {
    let container: HTMLDivElement;
    let root: Root;
    let changedCommand: SampleCommand | undefined;

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        changedCommand = undefined;
        await act(async () => {
            root.render(<AutoCommandForm command={SampleCommand} onFieldChange={(command) => { changedCommand = command; }} />);
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should render distinct text, number, boolean, and date values', () => {
        expect(container.querySelector<HTMLInputElement>('input[type="text"]')?.value).to.equal('Example');
        expect(container.querySelector<HTMLInputElement>('input[type="number"]')?.value).to.equal('12');
        expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).to.equal(true);
        expect(container.querySelector('[role="spinbutton"][aria-valuenow="2026"]')).not.to.equal(null);
    });

    it('should keep the other typed values when editing the real text input', async () => {
        const input = container.querySelector<HTMLInputElement>('input[type="text"]')!;
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Changed');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        expect(changedCommand?.name).to.equal('Changed');
        expect(changedCommand?.count).to.equal(12);
        expect(changedCommand?.enabled).to.equal(true);
        expect(changedCommand?.startDate).to.deep.equal(new Date('2026-01-02T12:00:00Z'));
    });
});
