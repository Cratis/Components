// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, vi } from 'vitest';

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: ComponentType<Record<string, unknown>>) => component,
}));

import { InputTextField } from '../CommandForm/fields/InputTextField';
import { TextAreaField } from '../CommandForm/fields/TextAreaField';

interface InjectedTextFieldProps {
    value: string;
    onChange: (value: unknown) => void;
    invalid: boolean;
    required: boolean;
    errors: string[];
    title?: string;
}

// SAFETY: The mocked asCommandFormField returns the injected component unchanged in this spec.
const TextInputField = InputTextField as unknown as ComponentType<InjectedTextFieldProps>;
// SAFETY: The mocked asCommandFormField returns the injected component unchanged in this spec.
const MultiLineField = TextAreaField as unknown as ComponentType<InjectedTextFieldProps>;

const injected: InjectedTextFieldProps = {
    value: 'Example',
    onChange: () => undefined,
    invalid: false,
    required: false,
    errors: [],
    title: 'Example',
};

const examples: Record<string, { element: React.ReactElement; root: string }> = {
    InputTextField: { element: <TextInputField {...injected} />, root: 'input' },
    TextAreaField: { element: <MultiLineField {...injected} />, root: 'textarea' },
};

describe('when rendering marked command form fields', () => {
    const render = async (element: React.ReactElement) => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        await act(async () => root.render(element));
        return { container, dispose: async () => { await act(async () => root.unmount()); container.remove(); } };
    };

    for (const [name, example] of Object.entries(examples)) {
        it(`should mark the ${name} root element with its component name`, async () => {
            const mounted = await render(example.element);
            const marked = mounted.container.querySelectorAll(`[data-cratis-component="${name}"]`);
            marked.length.should.equal(1);
            marked[0].tagName.toLowerCase().should.equal(example.root);
            await mounted.dispose();
        });
    }
});
