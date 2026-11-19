// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Command } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { CommandForm } from '@cratis/arc.react/commands';
import { Guid } from '@cratis/fundamentals';
import sinon from 'sinon';
import { vi } from 'vitest';
import { CommandDialog } from '../../../CommandDialog/CommandDialog';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import { AutoCommandFields, type AutoCommandFieldsProps } from '../../AutoCommandFields';
import { clearFieldTypeProviders, registerFieldTypeProvider } from '../../fieldTypeProviderRegistry';
import { registerDefaultFieldTypeProviders } from '../../defaultFieldTypeProviders';
import { GuidField } from '../../fields/GuidField';
import { successfulResponse } from '../../for_GuidField/given/a_guid_form';

// Independently authored, generated-shape command; every value is synthetic. `labels` has no provider.
export class SampleProfileCommand extends Command {
    readonly route: string = '/api/sample-profile';
    readonly propertyDescriptors = [
        new PropertyDescriptor('sampleId', Guid, true),
        new PropertyDescriptor('name', String),
        new PropertyDescriptor('age', Number),
        new PropertyDescriptor('labels', Map),
    ];
    sampleId: Guid | undefined = undefined;
    name = 'Sample User';
    age = 30;
    labels = new Map<string, string>();
    get requestParameters(): string[] { return []; }
    constructor() { super(Object, false); }
}

export type HostKind = 'form' | 'dialog';
export type HostOptions = {
    fields?: AutoCommandFieldsProps<SampleProfileCommand>;
    hostCurrentValues?: Partial<SampleProfileCommand>;
    registerGuid?: boolean;
};

/**
 * `AutoCommandFields` inside a real Arc `CommandForm` or a real `CommandDialog`; only fetch is substituted.
 */
export class an_auto_fields_host {
    container!: HTMLDivElement;
    root!: Root;
    http!: sinon.SinonStub<Parameters<typeof fetch>, ReturnType<typeof fetch>>;
    submitted: unknown[] = [];

    constructor() {
        beforeEach(() => this.setup());
        afterEach(async () => this.cleanup());
    }

    setup() {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        // SAFETY: jsdom omits ResizeObserver; the dialog overlay only calls these observer methods.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe = vi.fn();
            unobserve = vi.fn();
            disconnect = vi.fn();
        };
        clearFieldTypeProviders();
        registerDefaultFieldTypeProviders();
        this.container = document.createElement('div');
        document.body.append(this.container);
        this.root = createRoot(this.container);
        this.submitted = [];
        this.http = sinon.stub(globalThis, 'fetch').callsFake(async (_input, init) => {
            this.submitted.push(JSON.parse(String(init?.body)));
            return successfulResponse();
        });
    }

    async cleanup() {
        await act(async () => this.root.unmount());
        this.container.remove();
        this.http.restore();
        clearFieldTypeProviders();
        registerDefaultFieldTypeProviders();
    }

    registerGuidProvider() {
        registerFieldTypeProvider({ canHandle: (descriptor) => descriptor.type === Guid, component: GuidField });
    }

    element(kind: HostKind, options: HostOptions): ReactElement {
        const fields = <AutoCommandFields<SampleProfileCommand> {...options.fields} />;
        if (kind === 'dialog') {
            return <CratisComponentsProvider>
                <CommandDialog<SampleProfileCommand> command={SampleProfileCommand} title='Example' currentValues={options.hostCurrentValues}>
                    {fields}
                </CommandDialog>
            </CratisComponentsProvider>;
        }
        return <CommandForm<SampleProfileCommand> command={SampleProfileCommand} currentValues={options.hostCurrentValues}>
            {fields}
            <button type='submit'>Submit</button>
        </CommandForm>;
    }

    async render(kind: HostKind, options: HostOptions = {}) {
        if (options.registerGuid) this.registerGuidProvider();
        await act(async () => this.root.render(this.element(kind, options)));
    }

    async rerender(kind: HostKind, options: HostOptions) {
        await act(async () => this.root.render(this.element(kind, options)));
    }

    input(label: string) { return this.container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`) ?? document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!; }

    get labels() { return Array.from(document.querySelectorAll('input')).map((input) => input.getAttribute('aria-label')); }

    async edit(label: string, value: string) {
        await act(async () => {
            const input = this.input(label);
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    async submit(kind: HostKind) {
        await act(async () => {
            const button = kind === 'form'
                ? this.container.querySelector<HTMLButtonElement>('button[type="submit"]')
                : document.querySelector<HTMLButtonElement>('[data-cratis-part="confirm"]');
            button!.click();
        });
    }
}
