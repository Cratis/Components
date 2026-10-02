// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Mount } from '../for_OrderedItemEditor/Mount';
import { Harness } from './given';
import type { PropertyChangeProposal } from '../PropertyChangeProposal';

describe('when editing properties described by the host', () => {
    const mount = new Mount();
    beforeEach(() => mount.setup());
    afterEach(() => mount.teardown());

    const property = (name: string) => mount.parts('property').find((element) => element.dataset.property === name)!;
    const input = (name: string) => property(name).querySelector<HTMLInputElement>('input')!;

    it('should render one titled group per descriptor group', async () => {
        await mount.render(<Harness proposals={[]} />);

        expect(mount.parts('groupTitle').map((title) => title.textContent)).to.deep.equal(['Flow', 'Grid placement', 'Freeform placement']);
        expect(mount.parts('groupDescription')[0].textContent).to.equal('Applies inside a grid.');
    });

    it('should label every control through a native label', async () => {
        await mount.render(<Harness proposals={[]} />);

        const label = property('gap').querySelector('label')!;
        expect(label.textContent).to.equal('Gap');
        expect(label.htmlFor).to.equal(input('gap').id);
    });

    it('should show the unit and honor the range of a number', async () => {
        await mount.render(<Harness proposals={[]} initial={{ gap: 8 }} />);

        const gap = input('gap');
        expect(gap.value).to.equal('8');
        expect([gap.min, gap.max, gap.step]).to.deep.equal(['0', '64', '4']);
        expect(mount.parts('unit')[0].textContent).to.equal('px');
    });

    it('should propose a valid number with the values after the change', async () => {
        const proposals: PropertyChangeProposal[] = [];
        await mount.render(<Harness proposals={proposals} initial={{ align: 'start' }} />);

        await mount.type(input('gap'), '12');

        expect(proposals).to.have.length(1);
        expect(proposals[0]).to.deep.equal({ name: 'gap', value: 12, previous: undefined, values: { align: 'start', gap: 12 } });
    });

    it('should not propose a number outside the range and should say why', async () => {
        const proposals: PropertyChangeProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);

        await mount.type(input('gap'), '100');

        expect(proposals).to.have.length(0);
        expect(input('gap').getAttribute('aria-invalid')).to.equal('true');
        expect(property('gap').querySelector('[role="alert"]')!.textContent).to.equal('Enter 64 or less.');
    });

    it('should not propose a number below the minimum', async () => {
        await mount.render(<Harness proposals={[]} />);

        await mount.type(input('columns'), '0');

        expect(property('columns').querySelector('[role="alert"]')!.textContent).to.equal('Enter 1 or more.');
    });

    it('should reject an empty required number and clear an empty optional one', async () => {
        const proposals: PropertyChangeProposal[] = [];
        await mount.render(<Harness proposals={proposals} initial={{ gap: 8, columns: 3 }} />);

        await mount.type(input('columns'), '');
        expect(proposals).to.have.length(0);
        expect(property('columns').querySelector('[role="alert"]')!.textContent).to.equal('Enter a value.');

        await mount.type(input('gap'), '');
        expect(proposals).to.have.length(1);
        expect(proposals[0].value).to.equal(undefined);
        expect('gap' in proposals[0].values).to.equal(false);
    });

    it('should restore the shown value when an invalid entry is left', async () => {
        await mount.render(<Harness proposals={[]} initial={{ gap: 8 }} />);
        const gap = input('gap');
        await mount.type(gap, '100');

        await act(async () => { gap.focus(); gap.blur(); });

        expect(gap.value).to.equal('8');
        expect(gap.hasAttribute('aria-invalid')).to.equal(false);
    });

    it('should propose a choice, an on/off value and text', async () => {
        const proposals: PropertyChangeProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);

        await mount.select(property('align').querySelector('select')!, 'center');
        await act(async () => input('grow').click());
        await mount.type(input('name'), 'Sidebar');

        expect(proposals.map((proposal) => [proposal.name, proposal.value])).to.deep.equal([
            ['align', 'center'],
            ['grow', true],
            ['name', 'Sidebar'],
        ]);
    });

    it('should list only the options the host supports', async () => {
        await mount.render(<Harness proposals={[]} />);

        const options = Array.from(property('align').querySelectorAll('option')).map((option) => option.value);
        expect(options).to.deep.equal(['', 'start', 'center']);
    });

    it('should keep a value the host no longer offers visible as a choice', async () => {
        await mount.render(<Harness proposals={[]} initial={{ align: 'stretch' }} />);

        expect(property('align').querySelector('select')!.value).to.equal('stretch');
    });

    it('should show a property that is not editable as text, with its reason, and never propose it', async () => {
        const proposals: PropertyChangeProposal[] = [];
        await mount.render(<Harness proposals={proposals} initial={{ span: 2 }} />);

        const span = property('span');
        expect(span.getAttribute('data-readonly')).to.equal('true');
        expect(span.querySelector('input, select')).to.equal(null);
        expect(span.textContent).to.contain('Column span');
        expect(span.textContent).to.contain('2');
        expect(span.textContent).to.contain('Set by the template.');
        expect(proposals).to.have.length(0);
    });

    it('should show everything as text when the whole form is read-only', async () => {
        await mount.render(<Harness proposals={[]} readOnly initial={{ gap: 8, align: 'center', grow: true }} />);

        expect(mount.container.querySelector('input, select')).to.equal(null);
        expect(property('gap').textContent).to.contain('8 px');
        expect(property('align').textContent).to.contain('Center');
        expect(property('grow').textContent).to.contain('On');
    });

    it('should apply the host validation rules before proposing', async () => {
        const proposals: PropertyChangeProposal[] = [];
        await mount.render(
            <Harness proposals={proposals} validate={(name, value) => (name === 'x' && Number(value) < 0 ? 'Keep it on the canvas.' : undefined)} />,
        );

        await mount.type(input('x'), '-5');

        expect(proposals).to.have.length(0);
        expect(property('x').querySelector('[role="alert"]')!.textContent).to.equal('Keep it on the canvas.');
    });

    it('should show validation feedback the host supplies', async () => {
        await mount.render(<Harness proposals={[]} messages={{ gap: 'Too wide for this template.' }} />);

        expect(property('gap').querySelector('[role="alert"]')!.textContent).to.equal('Too wide for this template.');
        expect(input('gap').getAttribute('aria-invalid')).to.equal('true');
    });

    it('should leave the shown value to the host when a proposal is cancelled', async () => {
        const proposals: PropertyChangeProposal[] = [];
        await mount.render(<Harness proposals={proposals} apply={false} initial={{ gap: 8 }} />);
        const gap = input('gap');

        await mount.type(gap, '12');
        await act(async () => { gap.focus(); gap.blur(); });

        expect(proposals).to.have.length(1);
        expect(gap.value).to.equal('8');
    });

    it('should not propose a value equal to the current one', async () => {
        const proposals: PropertyChangeProposal[] = [];
        await mount.render(<Harness proposals={proposals} initial={{ gap: 8 }} />);

        await mount.type(input('gap'), '8');

        expect(proposals).to.have.length(0);
    });
});
