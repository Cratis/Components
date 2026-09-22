// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, createRef, useLayoutEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Command } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { useCommandFormContext, type CommandFormContextValue, type CommandFormHandle } from '@cratis/arc.react/commands';
import { Guid } from '@cratis/fundamentals';
import sinon from 'sinon';
import { AutoCommandForm, type AutoCommandFormProps } from '../../AutoCommandForm';
import { clearFieldTypeProviders } from '../../fieldTypeProviderRegistry';
import { registerDefaultFieldTypeProviders } from '../../defaultFieldTypeProviders';

// Independently authored generated-shape command; no domain or consumer fixture is involved.
export class SampleOptionalGuidCommand extends Command {
    readonly route: string = '/api/sample-optional-guid';
    readonly propertyDescriptors = [
        new PropertyDescriptor('sampleId', Guid, true),
        new PropertyDescriptor('name', String),
    ];
    sampleId: Guid | undefined = undefined;
    name = 'Sample User';
    get requestParameters(): string[] { return []; }
    constructor() { super(Object, false); }
}

export const sampleGuid = '852afc19-b630-43ba-a612-93e1c522078d';
export const exampleGuid = '715ad639-c834-4032-b193-42eb599b73d7';

export const successfulResponse = () => new Response(JSON.stringify({
    correlationId: Guid.empty.toString(),
    isSuccess: true,
    isAuthorized: true,
    isValid: true,
    hasExceptions: false,
    validationResults: [],
    exceptionMessages: [],
    exceptionStackTrace: '',
    authorizationFailureReason: '',
}), { status: 200 });

function SampleFooter({ capture }: { capture: (context: CommandFormContextValue<SampleOptionalGuidCommand>) => void }) {
    const context = useCommandFormContext<SampleOptionalGuidCommand>();
    useLayoutEffect(() => capture(context));
    return <button type='submit'>Submit</button>;
}

function SampleForm({ form, props, excludeGuidOnChange }: {
    form: a_guid_form;
    props: Partial<AutoCommandFormProps<SampleOptionalGuidCommand>>;
    excludeGuidOnChange: boolean;
}) {
    const [excludeGuid, setExcludeGuid] = useState(false);
    return <AutoCommandForm
        command={SampleOptionalGuidCommand}
        formRef={form.formRef}
        onValidationFailure={() => { form.validationFailures++; }}
        footer={<SampleFooter capture={(context) => { form.context = context; }} />}
        {...props}
        exclude={excludeGuid ? ['sampleId'] : props.exclude}
        onFieldChange={(...args) => {
            props.onFieldChange?.(...args);
            if (excludeGuidOnChange && args[1] === 'sampleId') setExcludeGuid(true);
        }}
    />;
}

/** Real React, Arc binding, command and executor; only fetch is substituted. */
export class a_guid_form {
    container!: HTMLDivElement;
    root!: Root;
    context!: CommandFormContextValue<SampleOptionalGuidCommand>;
    formRef = createRef<CommandFormHandle>();
    http!: sinon.SinonStub<Parameters<typeof fetch>, ReturnType<typeof fetch>>;
    validationFailures = 0;

    setup() {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        clearFieldTypeProviders();
        registerDefaultFieldTypeProviders();
        this.container = document.createElement('div');
        document.body.append(this.container);
        this.root = createRoot(this.container);
        this.http = sinon.stub(globalThis, 'fetch').callsFake(async () => successfulResponse());
    }

    async cleanup() {
        await act(async () => this.root.unmount());
        this.container.remove();
        this.http.restore();
        clearFieldTypeProviders();
        registerDefaultFieldTypeProviders();
    }

    async render(props: Partial<AutoCommandFormProps<SampleOptionalGuidCommand>> = {}, excludeGuidOnChange = false) {
        await act(async () => this.root.render(<SampleForm form={this} props={props} excludeGuidOnChange={excludeGuidOnChange} />));
    }

    get input() { return this.container.querySelector<HTMLInputElement>('input[aria-label="Sample Id"]')!; }

    async edit(value: string, input = this.input) {
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    async submit() {
        await act(async () => this.container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    }
}
