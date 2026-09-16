// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useLayoutEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type {} from 'chai/register-should';
import { afterEach, beforeEach, describe, it } from 'vitest';
import sinon from 'sinon';
import { Dropdown, type DropdownProps } from '../Dropdown';

const options = [{ value: 'first', label: 'First option' }, { value: 'second', label: 'Second option' }];

const modes: Array<[string, DropdownProps<unknown>]> = [
    ['single select', {}],
    ['filtered single select', { filter: true }],
    ['filtered multiple select', { filter: true, multiple: true, value: ['first'] }],
    ['native multiple select', { multiple: true, value: ['first'] }],
];

for (const [mode, props] of modes) {
    describe(`when associating an external label with a ${mode}`, () => {
        let container: HTMLDivElement;
        let root: Root;
        let control: HTMLButtonElement | HTMLInputElement | HTMLSelectElement;

        beforeEach(() => {
            (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
            container = document.createElement('div');
            document.body.append(container);
            root = createRoot(container);
        });
        afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

        const render = async (labelId?: string, additional: DropdownProps<unknown> = {}) => {
            await act(async () => root.render(
                <>
                    <label id={labelId} htmlFor='example-selection'>Example selection</label>
                    <span id='explicit-name'>Explicit name</span>
                    <Dropdown id='example-selection' value='first' options={options} {...props} {...additional} />
                </>,
            ));
            control = container.querySelector<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('#example-selection')!;
        };

        it('should put the external label first rather than naming the control only by its value', async () => {
            await render('example-label');
            String(control.getAttribute('aria-labelledby')).split(' ')[0].should.equal('example-label');
        });

        it('should generate an id for an id-less native label without changing its text', async () => {
            await render();
            const label = container.querySelector('label')!;
            label.id.should.not.equal('');
            String(control.getAttribute('aria-labelledby')).split(' ')[0].should.equal(label.id);
            label.textContent!.should.equal('Example selection');
            label.htmlFor.should.equal('example-selection');
        });

        it('should keep the association when the selected value changes', async () => {
            await render('example-label');
            await render('example-label', { value: props.multiple ? ['second'] : 'second' });
            String(control.getAttribute('aria-labelledby')).split(' ')[0].should.equal('example-label');
        });

        it('should prefer an explicitly supplied label reference', async () => {
            await render('example-label', { 'aria-labelledby': 'explicit-name' });
            String(control.getAttribute('aria-labelledby')).split(' ')[0].should.equal('explicit-name');
        });

        it('should refresh an external label id when its owning React tree changes it', async () => {
            await render('old-label');
            await render('new-label');
            String(control.getAttribute('aria-labelledby')).split(' ')[0].should.equal('new-label');
            String(control.getAttribute('aria-labelledby')).should.not.contain('old-label');
        });

        it('should respect a direct name supplied through the primary control part', async () => {
            const partName = props.filter ? 'filter' : props.multiple ? 'multiple' : 'trigger';
            await render('example-label', { pt: { [partName]: { 'aria-label': 'Part name' } } });
            String(control.getAttribute('aria-label')).should.equal('Part name');
            String(control.getAttribute('aria-labelledby')).should.not.contain('example-label');
        });

        it('should release its label observer when the control unmounts', async () => {
            const observe = sinon.spy(MutationObserver.prototype, 'observe');
            const disconnect = sinon.spy(MutationObserver.prototype, 'disconnect');
            try {
                await render('example-label');
                const ownedObserver = observe.getCalls().find(call =>
                    JSON.stringify(call.args[1]?.attributeFilter) === JSON.stringify(['for', 'id']),
                )?.thisValue;
                (ownedObserver !== undefined).should.equal(true);
                await act(async () => root.render(null));
                disconnect.calledOn(ownedObserver).should.equal(true);
            } finally {
                observe.restore();
                disconnect.restore();
            }
        });

        it('should not miss a label id change in a siblings mount layout effect', async () => {
            function RenameLabelOnMount() {
                useLayoutEffect(() => { container.querySelector('label')!.id = 'renamed-on-mount'; }, []);
                return null;
            }
            await act(async () => root.render(
                <><label id='initial-mount-label' htmlFor='example-selection'>Example selection</label>
                    <Dropdown id='example-selection' value='first' options={options} {...props} />
                    <RenameLabelOnMount />
                </>,
            ));
            control = container.querySelector('#example-selection')!;
            String(control.getAttribute('aria-labelledby')).split(' ')[0].should.equal('renamed-on-mount');
            String(control.getAttribute('aria-labelledby')).should.not.contain('initial-mount-label');
        });

        it('should follow labels updated independently of the Dropdown', async () => {
            function IndependentLabel() {
                const [version, setVersion] = useState(0);
                return <><label key={version} htmlFor='example-selection'>Label {version}</label><button onClick={() => setVersion(version + 1)}>Replace label</button></>;
            }
            await act(async () => root.render(<><IndependentLabel /><Dropdown id='example-selection' value='first' options={options} {...props} /></>));
            control = container.querySelector('#example-selection')!;
            const oldId = container.querySelector('label')!.id;
            await act(async () => container.querySelector<HTMLButtonElement>('button:not([data-cratis-part])')!.click());
            const currentLabel = container.querySelector('label')!;
            String(control.getAttribute('aria-labelledby')).split(' ')[0].should.equal(currentLabel.id);
            currentLabel.id.should.not.equal(oldId);
        });

        it('should not reuse an existing generated id when a label is prepended', async () => {
            function Labels() {
                const [prepended, setPrepended] = useState(false);
                return <>{prepended && <label htmlFor='example-selection'>First label</label>}<label htmlFor='example-selection'>Last label</label><button onClick={() => setPrepended(true)}>Prepend label</button></>;
            }
            await act(async () => root.render(<><Labels /><Dropdown id='example-selection' value='first' options={options} {...props} /></>));
            control = container.querySelector('#example-selection')!;
            await act(async () => container.querySelector<HTMLButtonElement>('button:not([data-cratis-part])')!.click());
            const labels = Array.from(container.querySelectorAll('label[for="example-selection"]'));
            const ids = labels.map(label => label.id);
            ids[0].should.not.equal(ids[1]);
            ids.every(Boolean).should.equal(true);
            String(control.getAttribute('aria-labelledby')).split(' ').slice(0, 2).should.deep.equal(ids);
        });

        it('should remove the old reference when a label is reassociated with another control', async () => {
            await render('example-label');
            await act(async () => { container.querySelector('label')!.htmlFor = 'other-selection'; });
            String(control.getAttribute('aria-labelledby')).should.not.contain('example-label');
        });

        it('should not merge a native label into an explicitly supplied direct name', async () => {
            await render('example-label', { 'aria-label': 'Direct name' });
            String(control.getAttribute('aria-label')).should.equal('Direct name');
            String(control.getAttribute('aria-labelledby')).should.not.contain('example-label');
        });
    });
}
