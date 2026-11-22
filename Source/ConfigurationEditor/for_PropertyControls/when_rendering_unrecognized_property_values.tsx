// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Mount } from '../for_OrderedItemEditor/Mount';
import { Harness } from './given';
import type { PropertyDescriptor } from '../PropertyDescriptor';

should();

describe('when rendering unrecognized property values', () => {
    const mount = new Mount();
    beforeEach(() => mount.setup());
    afterEach(() => mount.teardown());

    it('should render an unknown descriptor kind as the existing text fallback', async () => {
        const descriptor = { kind: 'future', name: 'sample', label: 'Sample', placeholder: 'Example' } as unknown as PropertyDescriptor;
        await mount.render(<Harness proposals={[]} groups={[{ id: 'sample', title: 'Sample', properties: [descriptor] }]} initial={{ sample: 'Original' }} />);

        const input = mount.container.querySelector('input')!;
        input.type.should.equal('text');
        input.value.should.equal('Original');
        input.placeholder.should.equal('Example');
        mount.parts('label')[0].getAttribute('for')!.should.equal(input.id);
    });

    it('should show empty native values for mismatched host value types', async () => {
        await mount.render(<Harness proposals={[]} initial={{ gap: 'eight', name: 42, align: 42, grow: 'true' }} />);

        const controls = Array.from(mount.container.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select'));
        controls.slice(0, 4).map((control) => control.value).should.deep.equal(['', '', 'on', '']);
        mount.container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked.should.equal(false);
    });
});
