// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import axe from 'axe-core';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Button } from '../Common/Button';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import { DatePickerInput } from '../Common/DatePickerInput';
import { Column } from '../DataTables/Column';
import { DataTableCore } from '../DataTables/DataTableCore';
import { Dropdown } from '../Dropdown/Dropdown';
import { Toolbar } from '../Toolbar/Toolbar';
import { ToolbarButton } from '../Toolbar/ToolbarButton';

describe('when scanning representative foundation surfaces', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(
                <CratisComponentsProvider value={{ locale: 'en-US' }}>
                    <main>
                        <Button label='Save' />
                        <Dropdown
                            aria-label='Role'
                            options={[
                                { label: 'Administrator', value: 'admin' },
                                { label: 'Developer', value: 'developer' },
                            ]}
                            value='developer'
                        />
                        <DatePickerInput
                            aria-label='Delivery date'
                            value={new Date(2024, 5, 15)}
                            onChange={() => undefined}
                        />
                        <DataTableCore
                            data={[{ id: 1, name: 'Sample User' }]}
                            dataKey='id'
                            emptyMessage='No people'
                        >
                            <Column field='name' header='Name' />
                        </DataTableCore>
                        <Toolbar aria-label='Drawing tools'>
                            <ToolbarButton
                                icon={<span aria-hidden='true'>D</span>}
                                title='Draw'
                            />
                        </Toolbar>
                    </main>
                </CratisComponentsProvider>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should_have_no_automated_wcag_a_or_aa_violations', async () => {
        const result = await axe.run(container, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
            rules: { 'color-contrast': { enabled: false } },
        });

        expect(
            result.violations.map((violation) => ({
                id: violation.id,
                nodes: violation.nodes.map((node) => node.target),
            })),
        ).to.deep.equal([]);
    });
});
