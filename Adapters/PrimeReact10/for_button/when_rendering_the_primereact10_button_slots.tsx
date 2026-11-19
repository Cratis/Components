// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { primeReact10UiLibrary } from '../src/index.js';
import { withPrimeApplication } from '../given/a_prime_application.js';

type SlotId = 'common.button' | 'common.iconButton';

const render = (slotId: SlotId, props: Readonly<Record<string, unknown>>) => {
    const declaration = primeReact10UiLibrary.slots[slotId];
    // SAFETY: The fixture props below are paired with the corresponding public slot contract.
    const Component = withPrimeApplication(declaration.render as unknown as ComponentType<Record<string, unknown>>);
    return renderToStaticMarkup(createElement(Component, props));
};

const buttonCases: Readonly<Record<string, Record<string, unknown>>> = {
    plain: {},
    labelOnly: { label: 'Save' },
    labelAndStringIcon: { label: 'Save', icon: 'pi pi-save' },
    labelAndNodeIcon: { label: 'Save', icon: createElement('svg', { 'data-test': 'icon' }) },
    childrenOnly: { children: 'Child content' },
    iconOnly: { icon: 'pi pi-save' },
    loading: { label: 'Save', icon: 'pi pi-save', loading: true },
    loadingWithSpinnerPart: { label: 'Save', loading: true, pt: { spinner: { className: 'spin', id: 'spinner' } } },
    disabled: { label: 'Save', disabled: true },
    explicitAriaBusy: { label: 'Save', 'aria-busy': true },
    title: { label: 'Save', title: 'Explicit title' },
    rootTitle: { label: 'Save', pt: { root: { title: 'Part title', 'aria-busy': true, className: 'part-root' } } },
    sizeSmall: { label: 'Save', size: 'small' },
    sizeLarge: { label: 'Save', size: 'large' },
    solidAccent: { label: 'Save', variant: 'solid', tone: 'accent' },
    outlineNeutral: { label: 'Save', variant: 'outline', tone: 'neutral' },
    ghostPositive: { label: 'Save', variant: 'ghost', tone: 'positive' },
    linkCaution: { label: 'Save', variant: 'link', tone: 'caution' },
    solidCritical: { label: 'Save', tone: 'critical', shape: 'pill' },
    deprecatedText: { label: 'Save', text: true },
    deprecatedLink: { label: 'Save', link: true },
    deprecatedOutlined: { label: 'Save', outlined: true },
    deprecatedRounded: { label: 'Save', rounded: true },
    severityDanger: { label: 'Save', severity: 'danger' },
    severitySecondary: { label: 'Save', severity: 'secondary' },
    severityContrast: { label: 'Save', severity: 'contrast' },
    variantWinsOverDeprecated: { label: 'Save', variant: 'ghost', link: true, text: true },
    toneWinsOverSeverity: { label: 'Save', tone: 'positive', severity: 'danger' },
    parts: {
        label: 'Save',
        icon: 'pi pi-save',
        className: 'consumer',
        style: { color: 'red' },
        autoFocus: true,
        type: 'submit',
        pt: {
            root: { className: 'part-root', style: { margin: 1 }, id: 'root-id' },
            icon: { className: 'part-icon', 'aria-hidden': false },
            label: { className: 'part-label', id: 'label-id' },
        },
    },
    tooltip: { label: 'Save', tooltip: 'Tip', tooltipOptions: { position: 'top', className: 'tip-class' } },
    nativeProps: { label: 'Save', 'data-extra': 'x', 'aria-describedby': 'other' },
};

const iconButtonCases: Readonly<Record<string, Record<string, unknown>>> = {
    plain: { icon: 'pi pi-save', 'aria-label': 'Save' },
    nodeIcon: { icon: createElement('svg', { 'data-test': 'icon' }), 'aria-label': 'Save' },
    loading: { icon: 'pi pi-save', 'aria-label': 'Save', loading: true, pt: { spinner: { className: 'spin' } } },
    disabled: { icon: 'pi pi-save', 'aria-label': 'Save', disabled: true },
    squareShape: { icon: 'pi pi-save', 'aria-label': 'Save', shape: 'default' },
    sizeLarge: { icon: 'pi pi-save', 'aria-label': 'Save', size: 'large' },
    toneAndVariant: { icon: 'pi pi-save', 'aria-label': 'Save', tone: 'critical', variant: 'outline' },
    deprecated: { icon: 'pi pi-save', 'aria-label': 'Save', severity: 'success', rounded: true, outlined: true },
    title: { icon: 'pi pi-save', 'aria-label': 'Save', title: 'Explicit title' },
    parts: {
        icon: 'pi pi-save',
        'aria-label': 'Save',
        className: 'consumer',
        style: { color: 'red' },
        type: 'submit',
        pt: { root: { className: 'part-root', id: 'root-id' }, icon: { className: 'part-icon', 'aria-hidden': false } },
    },
    tooltip: { icon: 'pi pi-save', 'aria-label': 'Save', tooltip: 'Tip', tooltipOptions: { position: 'bottom' } },
};

const renderAll = (slotId: SlotId, cases: Readonly<Record<string, Record<string, unknown>>>) =>
    Object.fromEntries(Object.entries(cases).map(([name, props]) => [name, render(slotId, props)]));

describe('when rendering the PrimeReact 10 button slots', () => {
    it('should render the button slot markup unchanged for every characterized input', () => {
        expect(renderAll('common.button', buttonCases)).toMatchSnapshot();
    });

    it('should render the icon button slot markup unchanged for every characterized input', () => {
        expect(renderAll('common.iconButton', iconButtonCases)).toMatchSnapshot();
    });
});
