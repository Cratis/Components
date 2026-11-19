// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { primeReact10UiLibrary } from '../src/index.js';
import { withPrimeApplication } from '../given/a_prime_application.js';

const render = (props: Readonly<Record<string, unknown>>) => {
    const declaration = primeReact10UiLibrary.slots['common.progress'];
    // SAFETY: The fixture props below are paired with the corresponding public slot contract.
    const Component = withPrimeApplication(declaration.render as unknown as ComponentType<Record<string, unknown>>);
    return renderToStaticMarkup(createElement(Component, props));
};

const cases: Readonly<Record<string, Record<string, unknown>>> = {
    defaults: {},
    determinateHalf: { value: 50 },
    determinateBelowRange: { value: -10 },
    determinateAboveRange: { value: 150 },
    complete: { value: 100 },
    hiddenValue: { value: 40, showValue: false },
    indeterminate: { mode: 'indeterminate', value: 40 },
    labelled: { value: 10, 'aria-label': 'Upload' },
    labelledBy: { value: 10, 'aria-label': 'Ignored', 'aria-labelledby': 'heading' },
    className: { value: 10, className: 'consumer' },
};

describe('when rendering the PrimeReact 10 progress slot', () => {
    it('should render the progress markup unchanged for every characterized input', () => {
        expect(Object.fromEntries(Object.entries(cases).map(([name, props]) => [name, render(props)]))).toMatchSnapshot();
    });
});
