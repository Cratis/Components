// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactElement } from 'react';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { TooltipImplementation } from './TooltipImplementation';

/** Position of the tooltip relative to its trigger element. */
export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

interface TooltipTriggerElementProps {
    className?: string;
    disabled?: boolean;
    'data-cratis-part'?: string;
    'data-cratis-tooltip-trigger'?: string;
}

/** Props for the {@link Tooltip} component. */
export interface TooltipProps {
    /** Text displayed inside the tooltip. Empty content disables the tooltip. */
    content?: string;
    /** Where the tooltip appears relative to its trigger. */
    position?: TooltipPosition;
    /** When true, suppresses the tooltip. */
    disabled?: boolean;
    /** Extra class name applied to the actual trigger element. */
    className?: string;
    /** One focusable element that triggers the tooltip. */
    children: ReactElement<TooltipTriggerElementProps>;
}

const coreTooltipDeclaration = Object.freeze({
    mode: 'atomic',
    fidelity: 'native',
    render: TooltipImplementation,
}) satisfies unstable_SlotDeclaration<'common.tooltip'>;

/** An accessible hover and keyboard-focus tooltip with stable Cratis parts. */
export const Tooltip = (props: TooltipProps) => {
    const declaration = unstable_useSlot('common.tooltip', coreTooltipDeclaration);
    return renderSlot(declaration, props);
};
