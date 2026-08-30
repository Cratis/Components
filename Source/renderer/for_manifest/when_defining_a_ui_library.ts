// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import type { ButtonProps } from '../../Common/Button';
import {
    unstable_defineUiLibrary,
    type unstable_CapabilityId,
    type unstable_SlotId,
    type unstable_SlotMap,
    type unstable_UiLibrary,
} from '..';

const Button = (() => null) as ComponentType<ButtonProps>;

describe('when defining a UI library', () => {
    it('should defensively copy and freeze the manifest containers', () => {
        const capabilities: unstable_CapabilityId[] = ['slot.render'];
        const slots: unstable_SlotMap = {
            'common.button': {
                mode: 'presentation',
                fidelity: 'native',
                render: Button,
            },
        };
        const profileSlots: unstable_SlotId[] = ['common.button'];
        const input = {
            id: 'sample',
            displayName: 'Sample',
            abi: 1,
            level: 'primitive' as const,
            profile: 'basic-controls/v1',
            profileSlots,
            capabilities,
            slots,
        };

        const result = unstable_defineUiLibrary(input);
        capabilities.push('theme.tokens');
        profileSlots.push('common.tooltip');
        Reflect.deleteProperty(slots, 'common.button');

        result.should.not.equal(input);
        result.capabilities.should.deep.equal(['slot.render']);
        result.profileSlots!.should.deep.equal(['common.button']);
        result.slots.should.have.property('common.button');
        Object.isFrozen(result).should.equal(true);
        Object.isFrozen(result.capabilities).should.equal(true);
        Object.isFrozen(result.profileSlots).should.equal(true);
        Object.isFrozen(result.slots).should.equal(true);
        Object.isFrozen(result.slots['common.button']).should.equal(true);
    });

    it('should default profile slots to the library own slot keys', () => {
        const result: unstable_UiLibrary = unstable_defineUiLibrary({
            id: 'sample',
            displayName: 'Sample',
            abi: 1,
            level: 'primitive',
            profile: 'basic-controls/v1',
            capabilities: ['slot.render'],
            slots: {
                'common.button': {
                    mode: 'presentation',
                    fidelity: 'native',
                    render: Button,
                },
            },
        });

        result.profileSlots!.should.deep.equal(['common.button']);
    });
});
