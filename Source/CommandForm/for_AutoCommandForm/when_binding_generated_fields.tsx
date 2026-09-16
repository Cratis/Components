// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { AutoCommandForm } from '../AutoCommandForm';
import { clearFieldTypeProviders, registerFieldTypeProvider } from '../fieldTypeProviderRegistry';
import { registerDefaultFieldTypeProviders } from '../defaultFieldTypeProviders';
import { SampleCommand } from './given/SampleCommand';

const changedDate = new Date('2026-02-03T12:00:00Z');
const ProbeField = asCommandFormField<WrappedFieldProps<unknown> & { title?: string }>(
    (props) => (
        <button
            type='button'
            data-field={props.title}
            onClick={() => props.onChange(props.title === 'Start Date' ? changedDate : 'Edited')}
        >
            {props.value instanceof Date ? props.value.toISOString() : String(props.value)}
        </button>
    ),
    { defaultValue: undefined },
);

describe('when binding generated fields through the real Arc CommandForm', () => {
    let container: HTMLDivElement;
    let root: Root;
    let changes: Array<{ command: SampleCommand; fieldName: string; oldValue: unknown; newValue: unknown }>;

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        changes = [];
        registerFieldTypeProvider({ canHandle: () => true, component: ProbeField });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        clearFieldTypeProviders();
        registerDefaultFieldTypeProviders();
    });

    const render = async (exclude: Array<keyof SampleCommand> = []) => {
        await act(async () => {
            root.render(
                <AutoCommandForm
                    command={SampleCommand}
                    exclude={exclude}
                    onFieldChange={(command, fieldName, oldValue, newValue) => {
                        changes.push({ command, fieldName, oldValue, newValue });
                    }}
                />,
            );
        });
    };

    it('should preserve each descriptor value and its type', async () => {
        await render();
        const fields = Array.from(container.querySelectorAll('[data-field]'), (field) => field.textContent);
        expect(fields).to.deep.equal(['Example', '12', 'true', '2026-01-02T12:00:00.000Z']);
    });

    it('should update only the date property when its generated field changes', async () => {
        await render();
        await act(async () => container.querySelector<HTMLButtonElement>('[data-field="Start Date"]')!.click());
        expect(changes).to.have.lengthOf(1);
        expect(changes[0].fieldName).to.equal('startDate');
        expect(changes[0].oldValue).to.deep.equal(new Date('2026-01-02T12:00:00Z'));
        expect(changes[0].newValue).to.equal(changedDate);
        expect(changes[0].command.startDate).to.equal(changedDate);
        expect(changes[0].command.name).to.equal('Example');
        expect(changes[0].command.count).to.equal(12);
    });

    it('should keep the date unchanged when a generated text field changes', async () => {
        await render();
        await act(async () => container.querySelector<HTMLButtonElement>('[data-field="Name"]')!.click());
        expect(changes[0].fieldName).to.equal('name');
        expect(changes[0].command.name).to.equal('Edited');
        expect(changes[0].command.startDate).to.deep.equal(new Date('2026-01-02T12:00:00Z'));
    });

    it('should omit excluded descriptors without changing the remaining bindings', async () => {
        await render(['name', 'count']);
        const fields = Array.from(container.querySelectorAll('[data-field]'), (field) => field.textContent);
        expect(fields).to.deep.equal(['true', '2026-01-02T12:00:00.000Z']);
    });
});
