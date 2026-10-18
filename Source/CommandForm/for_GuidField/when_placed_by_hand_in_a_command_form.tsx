// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CommandForm } from '@cratis/arc.react/commands';
import sinon from 'sinon';
import type {} from 'chai/register-should';
import { GuidField } from '../fields/GuidField';
import { exampleGuid, SampleOptionalGuidCommand, successfulResponse } from './given/a_guid_form';

function Section({ children }: { children: ReactNode }) {
    return <fieldset>{children}</fieldset>;
}

const placements = {
    'as a direct child': <GuidField<SampleOptionalGuidCommand> value={(command) => command.sampleId} title='Sample identifier' />,
    'inside a custom component': <Section><GuidField<SampleOptionalGuidCommand> value={(command) => command.sampleId} title='Sample identifier' /></Section>,
};

for (const [placement, field] of Object.entries(placements)) {
    describe(`when GuidField is placed by hand ${placement} of a command form`, () => {
        let container: HTMLDivElement;
        let root: Root;
        let http: sinon.SinonStub<Parameters<typeof fetch>, ReturnType<typeof fetch>>;
        let blockedCalls: number;
        const input = () => container.querySelector<HTMLInputElement>('input[aria-label="Sample identifier"]')!;
        const edit = async (value: string) => act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), value);
            input().dispatchEvent(new Event('input', { bubbles: true }));
        });
        const submit = async () => act(async () => container.querySelector<HTMLButtonElement>('button')!.click());

        beforeEach(async () => {
            (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
            container = document.createElement('div');
            document.body.append(container);
            root = createRoot(container);
            http = sinon.stub(globalThis, 'fetch').callsFake(async () => successfulResponse());
            await act(async () => root.render(
                <CommandForm command={SampleOptionalGuidCommand}>
                    {field}
                    <button type='submit'>Submit</button>
                </CommandForm>,
            ));
            await edit('partial');
            await submit();
            blockedCalls = http.callCount;
            await edit(exampleGuid);
            await submit();
        });

        afterEach(async () => {
            await act(async () => root.unmount());
            container.remove();
            http.restore();
        });

        it('should veto the invalid draft', () => blockedCalls.should.equal(0));
        it('should submit the native value once valid', () => JSON.parse(String(http.firstCall.args[1]!.body)).sampleId.should.equal(exampleGuid));
        it('should submit once', () => http.callCount.should.equal(1));
    });
}
