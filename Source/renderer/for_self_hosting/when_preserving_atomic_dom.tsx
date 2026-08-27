// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { DialogButtons } from '@cratis/arc.react/dialogs';
import { expect } from 'chai';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { DatePickerInput } from '../../Common/DatePickerInput';
import { Tooltip } from '../../Common/Tooltip';
import { TablePaginator } from '../../DataTables/TablePaginator';
import { Dialog } from '../../Dialogs/Dialog';
import { Dropdown } from '../../Dropdown/Dropdown';

interface DomBaseline {
    readonly html: string;
    readonly tags: Readonly<Record<string, number>>;
    readonly parts: Readonly<Record<string, number>>;
    readonly roles: Readonly<Record<string, number>>;
}

const baselines: Readonly<Record<string, DomBaseline>> = Object.freeze({
    tooltip: {
        html: '<button type="button" class="cratis-tooltip-trigger" data-cratis-part="trigger" data-cratis-tooltip-trigger="" tabindex="0">Save</button>',
        tags: { button: 1 },
        parts: { trigger: 1 },
        roles: {},
    },
    dropdown: {
        html: '<span class="cratis-dropdown" data-cratis-part="root" data-selected="true"><template></template><div class="cratis-dropdown__select" data-rac=""><button id="react-aria-_R_9H2_" data-cratis-part="trigger" data-selected="true" class="cratis-dropdown__trigger" data-rac="" type="button" tabindex="0" data-react-aria-pressable="true" aria-labelledby="react-aria-_R_9H7_ react-aria-_R_9H3_" aria-describedby="react-aria-_R_9H5_ react-aria-_R_9H6_" aria-haspopup="listbox" aria-expanded="false"><span id="react-aria-_R_9H7_" data-cratis-part="value" data-selected="true" class="cratis-dropdown__value" data-rac="">One</span><span class="cratis-dropdown__indicator" data-cratis-part="indicator" aria-hidden="true">⌄</span></button><div style="border:0;clip:rect(0 0 0 0);clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:fixed;width:1px;white-space:nowrap;top:0;left:0" aria-hidden="true" data-react-aria-prevent-focus="true" data-a11y-ignore="aria-hidden-focus" data-testid="hidden-select-container"><label><select tabindex="-1"><option value="" label=" "> </option><option value="string:one:0" selected="">One</option></select></label></div></div></span>',
        tags: {
            button: 1,
            div: 2,
            label: 1,
            option: 2,
            select: 1,
            span: 3,
            template: 1,
        },
        parts: { indicator: 1, root: 1, trigger: 1, value: 1 },
        roles: {},
    },
    dialog: {
        html: '<div class="cratis-dialog__backdrop" style="z-index:var(--cratis-z-index-dialog)" data-cratis-part="backdrop" data-open="true"><div class="cratis-dialog__positioner" data-cratis-part="positioner" data-open="true"><section class="cratis-dialog" style="width:450px" data-cratis-part="root" data-open="true"><section class="cratis-dialog__document" data-rac="" aria-labelledby="react-aria-_R_1_" role="dialog" tabindex="-1"><header class="cratis-dialog__header" data-cratis-part="header"><h2 id="react-aria-_R_1_" slot="title" data-cratis-part="title" class="cratis-dialog__title">Example dialog</h2><button type="button" class="cratis-dialog__close" data-cratis-part="close" aria-label="Close"><span aria-hidden="true">×</span></button></header><div class="cratis-dialog__content" data-cratis-part="content" data-open="true"><fieldset class="cratis-dialog__busy-scope" data-cratis-part="busy-scope">Dialog content</fieldset></div><footer class="cratis-dialog__footer" data-cratis-part="footer"><fieldset class="cratis-dialog__busy-scope cratis-dialog__busy-scope--footer" data-cratis-part="busy-scope"><button type="button" class="cratis-dialog__button cratis-dialog__button--primary" data-cratis-part="confirm" autofocus=""><span>Ok</span></button><button type="button" class="cratis-dialog__button cratis-dialog__button--secondary" data-cratis-part="cancel"><span>Cancel</span></button></fieldset></footer></section></section></div></div>',
        tags: {
            button: 3,
            div: 3,
            fieldset: 2,
            footer: 1,
            h2: 1,
            header: 1,
            section: 2,
            span: 3,
        },
        parts: {
            backdrop: 1,
            'busy-scope': 2,
            cancel: 1,
            close: 1,
            confirm: 1,
            content: 1,
            footer: 1,
            header: 1,
            positioner: 1,
            root: 1,
            title: 1,
        },
        roles: { dialog: 1 },
    },
    datePicker: {
        html: '<div class="cratis-date-picker" data-cratis-part="root"><div class="cratis-date-picker__picker" data-rac=""><div data-react-aria-pressable="true" id="react-aria-_R_1H3_" aria-label="Appointment date" aria-labelledby="react-aria-_R_1H3_" aria-describedby="react-aria-_R_1H6_ react-aria-_R_1H7_" role="group" class="cratis-date-picker__group" data-cratis-part="group" data-empty="true" data-rac=""><div id="react-aria-_R_1H2_" role="presentation" data-react-aria-pressable="true" style="unicode-bidi:isolate" class="cratis-date-picker__input" data-cratis-part="input" data-rac=""><span data-cratis-part="segment" role="spinbutton" aria-valuetext="Empty" aria-valuemin="1" aria-valuemax="12" id="react-aria-_R_5ld_" aria-label="month, Appointment date" aria-describedby="react-aria-_R_5dH3_ react-aria-_R_5dH4_ react-aria-_R_1H6_ react-aria-_R_1H7_" data-placeholder="true" contentEditable="true" spellCheck="false" autoCorrect="off" enterKeyHint="next" inputMode="numeric" tabindex="0" style="caret-color:transparent" class="cratis-date-picker__segment" data-rac="" data-type="month">mm</span><span data-cratis-part="segment" aria-hidden="true" class="cratis-date-picker__segment" data-rac="" data-type="literal">/</span><span data-cratis-part="segment" role="spinbutton" aria-valuetext="Empty" aria-valuemin="1" aria-valuemax="31" id="react-aria-_R_dld_" aria-label="day, Appointment date" data-placeholder="true" contentEditable="true" spellCheck="false" autoCorrect="off" enterKeyHint="next" inputMode="numeric" tabindex="0" style="caret-color:transparent" class="cratis-date-picker__segment" data-rac="" data-type="day">dd</span><span data-cratis-part="segment" aria-hidden="true" class="cratis-date-picker__segment" data-rac="" data-type="literal">/</span><span data-cratis-part="segment" role="spinbutton" aria-valuetext="Empty" aria-valuemin="1" aria-valuemax="9999" id="react-aria-_R_lld_" aria-label="year, Appointment date" data-placeholder="true" contentEditable="true" spellCheck="false" autoCorrect="off" enterKeyHint="next" inputMode="numeric" tabindex="0" style="caret-color:transparent" class="cratis-date-picker__segment" data-rac="" data-type="year">yyyy</span></div><input type="text" hidden="" class="" data-rac="" value=""/><button id="react-aria-_R_1_" data-cratis-part="trigger" class="cratis-date-picker__trigger" data-rac="" type="button" tabindex="0" data-react-aria-pressable="true" aria-describedby="react-aria-_R_1H6_ react-aria-_R_1H7_" aria-label="Open calendar" aria-labelledby="react-aria-_R_1_ react-aria-_R_1H3_" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true">▦</span></button></div></div><div style="border:0;clip:rect(0 0 0 0);clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:fixed;width:1px;white-space:nowrap;top:0;left:0" aria-hidden="true" data-react-aria-prevent-focus="true" data-a11y-ignore="aria-hidden-focus" data-testid="hidden-dateinput-container"><input tabindex="-1" type="date" form="" step="60" value=""/></div></div>',
        tags: { button: 1, div: 5, input: 2, span: 6 },
        parts: { group: 1, input: 1, root: 1, segment: 5, trigger: 1 },
        roles: { group: 1, presentation: 1, spinbutton: 3 },
    },
    paginator: {
        html: '<div role="navigation" aria-label="Pagination" data-cratis-part="root" class="cratis-table-paginator"><button type="button" class="cratis-button" aria-label="First page" data-cratis-part="root" data-variant="ghost" data-shape="default" data-size="normal"><span class="cratis-button__label" data-cratis-part="label"><span aria-hidden="true">«</span></span></button><button type="button" class="cratis-button" aria-label="Previous page" data-cratis-part="root" data-variant="ghost" data-shape="default" data-size="normal"><span class="cratis-button__label" data-cratis-part="label"><span aria-hidden="true">‹</span></span></button><span class="cratis-table-paginator-info" data-cratis-part="info">2 / 3</span><button type="button" class="cratis-button" aria-label="Next page" data-cratis-part="root" data-variant="ghost" data-shape="default" data-size="normal"><span class="cratis-button__label" data-cratis-part="label"><span aria-hidden="true">›</span></span></button><button type="button" class="cratis-button" aria-label="Last page" data-cratis-part="root" data-variant="ghost" data-shape="default" data-size="normal"><span class="cratis-button__label" data-cratis-part="label"><span aria-hidden="true">»</span></span></button></div>',
        tags: { button: 4, div: 1, span: 9 },
        parts: { info: 1, label: 4, root: 5 },
        roles: { navigation: 1 },
    },
});

const countBy = (
    elements: readonly Element[],
    value: (element: Element) => string | null,
) =>
    Object.fromEntries(
        [...elements]
            .map(value)
            .filter((entry): entry is string => Boolean(entry))
            .sort()
            .reduce(
                (counts, entry) =>
                    counts.set(entry, (counts.get(entry) ?? 0) + 1),
                new Map<string, number>(),
            ),
    );

const summarize = (html: string) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    const elements = Array.from(template.content.querySelectorAll('*'));
    return {
        tags: countBy(elements, (element) => element.tagName.toLowerCase()),
        parts: countBy(elements, (element) =>
            element.getAttribute('data-cratis-part'),
        ),
        roles: countBy(elements, (element) => element.getAttribute('role')),
    };
};

const renderWithProvider = (element: ReactElement) =>
    renderToStaticMarkup(
        <CratisComponentsProvider>{element}</CratisComponentsProvider>,
    );

const renderings = () => ({
    tooltip: renderWithProvider(
        <Tooltip content='Save changes'>
            <button type='button'>Save</button>
        </Tooltip>,
    ),
    dropdown: renderWithProvider(
        <Dropdown value='one' options={[{ label: 'One', value: 'one' }]} />,
    ),
    dialog: renderWithProvider(
        <Dialog title='Example dialog' buttons={DialogButtons.OkCancel}>
            Dialog content
        </Dialog>,
    ),
    datePicker: renderWithProvider(
        <DatePickerInput
            value={null}
            onChange={() => undefined}
            aria-label='Appointment date'
        />,
    ),
    paginator: renderWithProvider(
        <TablePaginator
            page={1}
            pageCount={3}
            onPageChange={() => undefined}
        />,
    ),
});

describe('when preserving the Core atomic DOM baseline', () => {
    for (const [name, html] of Object.entries(renderings())) {
        it(`should keep ${name} byte-identical with exact tags, parts, and roles`, () => {
            const baseline = baselines[name];
            const summary = summarize(html);
            expect(html).to.equal(baseline.html);
            expect(summary.tags).to.deep.equal(baseline.tags);
            expect(summary.parts).to.deep.equal(baseline.parts);
            expect(summary.roles).to.deep.equal(baseline.roles);
        });
    }
});
