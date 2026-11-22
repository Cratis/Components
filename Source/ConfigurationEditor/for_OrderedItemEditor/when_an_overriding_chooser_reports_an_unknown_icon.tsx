// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Harness } from './given';
import { Mount } from './Mount';
import type { OrderedItemProposal } from '../OrderedItemProposal';

should();

describe('when an overriding chooser reports an unknown icon', () => {
    const mount = new Mount();
    const proposals: OrderedItemProposal[] = [];

    beforeEach(async () => {
        mount.setup();
        proposals.length = 0;
        await mount.render(
            <Harness
                proposals={proposals}
                allowedIcons={[]}
                renderIconField={({ onChange }) => (
                    <button type='button' onClick={() => onChange({ library: 'example-icons', key: 'unlisted' })}>Pick unlisted</button>
                )}
            />,
        );
        await mount.click(mount.control('page-a', 'icon').querySelector('button')!);
    });
    afterEach(() => mount.teardown());

    it('should retain the host override for an identity absent from the restricted catalog', () => {
        proposals.should.have.length(1);
        proposals[0].items[0].icon!.should.deep.equal({ library: 'example-icons', key: 'unlisted' });
    });
});
