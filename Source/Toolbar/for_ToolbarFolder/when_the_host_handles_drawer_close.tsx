// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { should } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { ToolbarFolder } from '../ToolbarFolder';
import { Mount } from '../../ConfigurationEditor/for_OrderedItemEditor/Mount';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

should();

describe('when the host handles the drawer close part', () => {
    const mount = new Mount();
    const states: string[] = [];
    let trigger: HTMLButtonElement;
    let panel: HTMLElement;

    beforeEach(async () => {
        mount.setup();
        states.length = 0;
        await mount.render(
            <ToolbarFolder
                icon={<span>T</span>}
                title='Tools'
                presentation='drawer'
                pt={{
                    panel: { id: 'sample-panel', style: { color: 'red' } },
                    drawerTitle: { id: 'sample-heading' },
                    drawerClose: { onClick: event => {
                        states.push(trigger.getAttribute('aria-expanded')!);
                        event.preventDefault();
                    } },
                }}
            />,
        );
        trigger = mount.parts('toolbar-folder-trigger')[0] as HTMLButtonElement;
        panel = mount.parts('toolbar-folder-panel')[0];
        await mount.click(trigger);
        await mount.click(mount.parts('toolbar-folder-close')[0]);
        await act(async () => { await new Promise(resolve => window.setTimeout(resolve, 0)); });
    });
    afterEach(() => mount.teardown());

    it('should call the host before closing even when the host prevents default', () => {
        states.should.deep.equal(['true']);
        trigger.getAttribute('aria-expanded')!.should.equal('false');
        panel.hasAttribute('inert').should.equal(true);
        (document.activeElement === trigger).should.equal(true);
    });

    it('should keep the part ids and host style on the closed panel', () => {
        trigger.getAttribute('aria-controls')!.should.equal('sample-panel');
        panel.getAttribute('aria-labelledby')!.should.equal('sample-heading');
        panel.style.color.should.equal('red');
        mount.parts('toolbar-folder-title')[0].id.should.equal('sample-heading');
    });
});
