// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import sinon from 'sinon';
import { CommandForm } from '@cratis/arc.react/commands';
import type {} from 'chai/register-should';

import { InputTextField } from '../../fields/InputTextField';
import { SampleOptionalGuidCommand, successfulResponse } from '../../for_GuidField/given/a_guid_form';
import { a_field_host } from '../given/a_field_host';
import { withStubAdapter } from '../given/a_stub_adapter';

describe('when a slot-rendered field is edited in a real command form', () => {
    const host = new a_field_host();
    let http: sinon.SinonStub<Parameters<typeof fetch>, ReturnType<typeof fetch>>;

    beforeEach(async () => {
        host.mount();
        http = sinon.stub(globalThis, 'fetch').callsFake(async () => successfulResponse());
        await host.renderNode(withStubAdapter(
            <CommandForm command={SampleOptionalGuidCommand}>
                <InputTextField<SampleOptionalGuidCommand> value={(command) => command.name} title='Name' />
                <button type='submit'>Submit</button>
            </CommandForm>,
        ));
        await host.type('Grace');
        await host.blur();
        await act(async () => host.container.querySelector<HTMLButtonElement>('button')!.click());
    });
    afterEach(async () => {
        await host.unmount();
        http.restore();
    });

    it('should render the field through the adapter', () => host.stubs('text').length.should.equal(1));
    it('should propagate the edited value into the command', () =>
        JSON.parse(String(http.firstCall.args[1]!.body)).name.should.equal('Grace'));
});
