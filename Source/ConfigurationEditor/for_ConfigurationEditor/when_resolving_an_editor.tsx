// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { ConfigurationEditor } from '../ConfigurationEditor';
import { ConfigurationEditorProvider } from '../ConfigurationEditorProvider';
import { Mount } from '../for_OrderedItemEditor/Mount';

interface NavigationValue {
    entries: string[];
}

describe('when resolving the editor for a component type', () => {
    const mount = new Mount();
    beforeEach(() => mount.setup());
    afterEach(() => mount.teardown());

    const navigationEditor = ({ value, onChange, readOnly, context }: { value: NavigationValue; onChange: (value: NavigationValue) => void; readOnly: boolean; context?: string }) => (
        <div data-testid='navigation-editor' data-readonly={readOnly || undefined} data-context={context}>
            {value.entries.join(',')}
            <button type='button' onClick={() => onChange({ entries: [...value.entries, 'added'] })}>Add</button>
        </div>
    );

    it('should render the editor registered for the type', async () => {
        await mount.render(
            <ConfigurationEditorProvider editors={{ navigation: navigationEditor as never }}>
                <ConfigurationEditor componentType='navigation' value={{ entries: ['a', 'b'] }} onChange={() => undefined} />
            </ConfigurationEditorProvider>,
        );

        expect(mount.container.querySelector('[data-testid="navigation-editor"]')!.textContent).to.contain('a,b');
    });

    it('should pass the value, read-only flag and host context through untouched', async () => {
        await mount.render(
            <ConfigurationEditorProvider editors={{ navigation: navigationEditor as never }}>
                <ConfigurationEditor componentType='navigation' value={{ entries: [] }} onChange={() => undefined} readOnly context='host-data' />
            </ConfigurationEditorProvider>,
        );

        const editor = mount.container.querySelector('[data-testid="navigation-editor"]')!;
        expect(editor.getAttribute('data-readonly')).to.equal('true');
        expect(editor.getAttribute('data-context')).to.equal('host-data');
    });

    it('should deliver the registered editor proposals to the host', async () => {
        const proposals: NavigationValue[] = [];
        await mount.render(
            <ConfigurationEditorProvider editors={{ navigation: navigationEditor as never }}>
                <ConfigurationEditor componentType='navigation' value={{ entries: ['a'] }} onChange={(proposal) => proposals.push(proposal)} />
            </ConfigurationEditorProvider>,
        );

        await mount.click(mount.container.querySelector('button')!);

        expect(proposals).to.deep.equal([{ entries: ['a', 'added'] }]);
    });

    it('should fall back for a type with no registered editor', async () => {
        await mount.render(
            <ConfigurationEditorProvider editors={{ navigation: navigationEditor as never }}>
                <ConfigurationEditor componentType='banner' value={{}} onChange={() => undefined} fallback={<p>Generic controls</p>} />
            </ConfigurationEditorProvider>,
        );

        expect(mount.container.textContent).to.equal('Generic controls');
    });

    it('should hand a fallback function the same props a registered editor would receive', async () => {
        await mount.render(
            <ConfigurationEditor
                componentType='banner'
                value={{ title: 'Hi' }}
                onChange={() => undefined}
                fallback={({ componentType, value }) => <p>{componentType}:{(value as { title: string }).title}</p>}
            />,
        );

        expect(mount.container.textContent).to.equal('banner:Hi');
    });

    it('should render nothing without a provider or a fallback', async () => {
        await mount.render(<ConfigurationEditor componentType='banner' value={{}} onChange={() => undefined} />);

        expect(mount.container.innerHTML).to.equal('');
    });

    it('should let a nested provider add to and override its parent', async () => {
        const outer = () => <p>outer navigation</p>;
        const inner = () => <p>inner navigation</p>;
        await mount.render(
            <ConfigurationEditorProvider editors={{ navigation: outer, banner: outer }}>
                <ConfigurationEditorProvider editors={{ navigation: inner }}>
                    <ConfigurationEditor componentType='navigation' value={{}} onChange={() => undefined} />
                    <ConfigurationEditor componentType='banner' value={{}} onChange={() => undefined} />
                </ConfigurationEditorProvider>
            </ConfigurationEditorProvider>,
        );

        expect(mount.container.textContent).to.equal('inner navigationouter navigation');
    });
});
