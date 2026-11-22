// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Mount } from '../for_OrderedItemEditor/Mount';
import { Harness } from './given';
import type { PropertyChangeProposal } from '../PropertyChangeProposal';

should();

describe('when leaving a rejected text draft with Escape', () => {
    const mount = new Mount();
    const proposals: PropertyChangeProposal[] = [];
    let input: HTMLInputElement;
    let escaped: boolean;

    beforeEach(async () => {
        mount.setup();
        proposals.length = 0;
        escaped = false;
        await mount.render(
            <div onKeyDown={() => { escaped = true; }}>
                <Harness proposals={proposals} initial={{ name: 'Sample' }} validate={() => 'Keep the original.'} />
            </div>,
        );
        input = mount.container.querySelector<HTMLInputElement>('input[type="text"]')!;
        await mount.type(input, 'Rejected');
        await mount.key(input, 'Escape');
    });
    afterEach(() => mount.teardown());

    it('should restore the host value and clear the local validation message', () => {
        input.value.should.equal('Sample');
        input.hasAttribute('aria-invalid').should.equal(false);
        mount.parts('message').length.should.equal(1); // The unavailable property still has its note.
    });

    it('should neither propose the rejected value nor let Escape reach the host', () => {
        proposals.should.have.length(0);
        escaped.should.equal(false);
    });
});
