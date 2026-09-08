// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import type { ButtonProps } from '../../Common/Button';
import type { TooltipProps } from '../../Common/Tooltip';
import {
    unstable_composeUiLibraries,
    unstable_defineUiLibrary,
} from '..';

const FirstButton = (() => null) as ComponentType<ButtonProps>;
const LastButton = (() => null) as ComponentType<ButtonProps>;
const Tooltip = (() => null) as ComponentType<TooltipProps>;

describe('when composing UI libraries', () => {
    const first = unstable_defineUiLibrary({
        id: 'first',
        displayName: 'First',
        abi: 1,
        level: 'primitive',
        profile: 'basic-controls/v1',
        capabilities: ['slot.render', 'theme.tokens'],
        slots: {
            'common.button': {
                mode: 'presentation',
                fidelity: 'native',
                render: FirstButton,
            },
        },
    });
    const last = unstable_defineUiLibrary({
        id: 'last',
        displayName: 'Last',
        abi: 1,
        level: 'full',
        profile: 'complete-controls/v1',
        capabilities: ['slot.render', 'focus.restore'],
        slots: {
            'common.button': {
                mode: 'presentation',
                fidelity: 'emulated',
                render: LastButton,
            },
            'common.tooltip': {
                mode: 'atomic',
                fidelity: 'native',
                render: Tooltip,
            },
        },
    });

    it('should apply last-library-wins metadata and slots', () => {
        const result = unstable_composeUiLibraries(first, last);

        result.id.should.equal('last');
        result.displayName.should.equal('Last');
        result.level.should.equal('full');
        result.profile.should.equal('complete-controls/v1');
        result.profileSlots!.should.deep.equal([
            'common.button',
            'common.tooltip',
        ]);
        result.slots['common.button']!.render.should.equal(LastButton);
        result.slots['common.tooltip']!.render.should.equal(Tooltip);
    });

    it('should union capabilities deterministically and freeze the result', () => {
        const result = unstable_composeUiLibraries(first, last);

        result.capabilities.should.deep.equal([
            'slot.render',
            'theme.tokens',
            'focus.restore',
        ]);
        Object.isFrozen(result).should.equal(true);
        Object.isFrozen(result.capabilities).should.equal(true);
        Object.isFrozen(result.slots).should.equal(true);
    });

    it('should reject an empty composition', () => {
        (() => unstable_composeUiLibraries()).should.throw(RangeError);
    });
});
