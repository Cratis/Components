// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { Button } from '../../Common/Button';
import { Checkbox } from '../../Common/Checkbox';
import { IconButton } from '../../Common/IconButton';
import { Radio } from '../../Common/Radio';
import { Surface } from '../../Common/Surface';
import { Switch } from '../../Common/Switch';
import { TextArea } from '../../Common/TextArea';
import { TextInput } from '../../Common/TextInput';
import { ProgressBar } from '../../Display/ProgressBar';

interface DomBaseline {
    readonly html: string;
    readonly tags: Readonly<Record<string, number>>;
    readonly parts: Readonly<Record<string, number>>;
    readonly roles: Readonly<Record<string, number>>;
    readonly controlSelector: string;
}

const baselines: Readonly<Record<string, DomBaseline>> = Object.freeze({
    button: {
        html: '<button type="button" class="cratis-button" data-cratis-part="root" data-variant="solid" data-shape="default" data-size="normal"><span class="cratis-button__label" data-cratis-part="label">Save</span></button>',
        tags: { button: 1, span: 1 },
        parts: { label: 1, root: 1 },
        roles: {},
        controlSelector: 'button',
    },
    iconButton: {
        html: '<button type="button" class="cratis-button" aria-label="Add item" data-cratis-part="root" data-variant="solid" data-shape="pill" data-size="normal" data-icon-only="true"><span class="cratis-button__icon" data-cratis-part="icon" aria-hidden="true"><span>+</span></span></button>',
        tags: { button: 1, span: 2 },
        parts: { icon: 1, root: 1 },
        roles: {},
        controlSelector: 'button',
    },
    textInput: {
        html: '<input type="text" class="cratis-text-input" data-cratis-part="root" value="Sample"/>',
        tags: { input: 1 },
        parts: { root: 1 },
        roles: {},
        controlSelector: 'input',
    },
    textArea: {
        html: '<textarea class="cratis-text-area" data-cratis-part="root">Sample</textarea>',
        tags: { textarea: 1 },
        parts: { root: 1 },
        roles: {},
        controlSelector: 'textarea',
    },
    checkbox: {
        html: '<label class="cratis-choice" data-cratis-part="root" data-selected="true"><input type="checkbox" class="cratis-choice__input" data-cratis-part="input" data-selected="true" checked=""/><span class="cratis-checkbox__box" data-cratis-part="box" data-selected="true" aria-hidden="true"><span class="cratis-checkbox__indicator" data-cratis-part="indicator" data-selected="true">✓</span></span><span class="cratis-choice__label" data-cratis-part="label" data-selected="true">Choice</span></label>',
        tags: { input: 1, label: 1, span: 3 },
        parts: { box: 1, indicator: 1, input: 1, label: 1, root: 1 },
        roles: {},
        controlSelector: 'input[type="checkbox"]',
    },
    radio: {
        html: '<label class="cratis-choice" data-cratis-part="root" data-selected="true"><input type="radio" class="cratis-choice__input" data-cratis-part="input" data-selected="true" name="sample" checked="" value="one"/><span class="cratis-radio__box" data-cratis-part="box" data-selected="true" aria-hidden="true"><span class="cratis-radio__indicator" data-cratis-part="indicator" data-selected="true"></span></span><span class="cratis-choice__label" data-cratis-part="label" data-selected="true">Choice</span></label>',
        tags: { input: 1, label: 1, span: 3 },
        parts: { box: 1, indicator: 1, input: 1, label: 1, root: 1 },
        roles: {},
        controlSelector: 'input[type="radio"]',
    },
    switch: {
        html: '<label class="cratis-choice" data-cratis-part="root" data-selected="true"><input type="checkbox" role="switch" class="cratis-choice__input" data-cratis-part="input" data-selected="true" checked=""/><span class="cratis-switch__control" data-cratis-part="control" data-selected="true" aria-hidden="true"><span class="cratis-switch__handle" data-cratis-part="handle" data-selected="true"></span></span><span class="cratis-choice__label" data-cratis-part="label" data-selected="true">Choice</span></label>',
        tags: { input: 1, label: 1, span: 3 },
        parts: { control: 1, handle: 1, input: 1, label: 1, root: 1 },
        roles: { switch: 1 },
        controlSelector: 'input[role="switch"]',
    },
    progress: {
        html: '<div class="cratis-progress-bar" data-cratis-part="root" data-mode="determinate" data-busy="true" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="42"><span class="cratis-progress-bar__indicator" data-cratis-part="indicator" style="width:42%"><span class="cratis-progress-bar__label" data-cratis-part="label">42%</span></span></div>',
        tags: { div: 1, span: 2 },
        parts: { indicator: 1, label: 1, root: 1 },
        roles: { progressbar: 1 },
        controlSelector: '[role="progressbar"]',
    },
    surface: {
        html: '<article class="cratis-surface" data-cratis-part="root">Content</article>',
        tags: { article: 1 },
        parts: { root: 1 },
        roles: {},
        controlSelector: 'article',
    },
});

const countBy = (elements: readonly Element[], value: (element: Element) => string | null) =>
    Object.fromEntries(
        [...elements]
            .map(value)
            .filter((entry): entry is string => Boolean(entry))
            .sort()
            .reduce((counts, entry) => counts.set(entry, (counts.get(entry) ?? 0) + 1), new Map<string, number>()),
    );

const summarize = (html: string) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    const elements = Array.from(template.content.querySelectorAll('*'));
    return {
        tags: countBy(elements, (element) => element.tagName.toLowerCase()),
        parts: countBy(elements, (element) => element.getAttribute('data-cratis-part')),
        roles: countBy(elements, (element) => element.getAttribute('role')),
        fragment: template.content,
    };
};

const renderings = () => ({
    button: renderToStaticMarkup(<Button label='Save' />),
    iconButton: renderToStaticMarkup(
        <IconButton icon={<span>+</span>} aria-label='Add item' />,
    ),
    textInput: renderToStaticMarkup(<TextInput defaultValue='Sample' />),
    textArea: renderToStaticMarkup(<TextArea defaultValue='Sample' />),
    checkbox: renderToStaticMarkup(<Checkbox label='Choice' defaultChecked />),
    radio: renderToStaticMarkup(
        <Radio name='sample' value='one' label='Choice' defaultChecked />,
    ),
    switch: renderToStaticMarkup(<Switch label='Choice' defaultChecked />),
    progress: renderToStaticMarkup(<ProgressBar value={42} />),
    surface: renderToStaticMarkup(<Surface as='article'>Content</Surface>),
});

describe('when preserving the Core presentation DOM baseline', () => {
    for (const [name, html] of Object.entries(renderings())) {
        it(`should keep ${name} byte-identical with exact tags, parts, roles, and one real root`, () => {
            const baseline = baselines[name];
            const summary = summarize(html);

            expect(html).to.equal(baseline.html);
            expect(summary.tags).to.deep.equal(baseline.tags);
            expect(summary.parts).to.deep.equal(baseline.parts);
            expect(summary.roles).to.deep.equal(baseline.roles);
            expect(summary.fragment.querySelectorAll('[data-cratis-part="root"]')).to
                .have.lengthOf(1);
            expect(summary.fragment.querySelectorAll(baseline.controlSelector)).to.have
                .lengthOf(1);
        });
    }
});
