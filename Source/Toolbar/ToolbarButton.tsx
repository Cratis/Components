// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';

/** Props for the {@link ToolbarButton} component. */
export interface ToolbarButtonProps {
    /** The PrimeIcons CSS class to use as the icon (e.g. 'pi pi-home'). */
    icon: string;

    /** Tooltip text shown when the user hovers over the button. */
    tooltip: string;

    /** Whether the button is currently in the active/selected state. */
    active?: boolean;

    /** Callback invoked when the button is clicked. */
    onClick?: () => void;

    /** Position of the tooltip relative to the button (default: 'right'). */
    tooltipPosition?: TooltipPosition;
}

/**
 * An icon button with a tooltip, intended to be placed inside a {@link Toolbar}.
 * Uses the shared {@link Tooltip} component for consistent hover labels.
 */
export const ToolbarButton = ({ icon, tooltip, active = false, onClick, tooltipPosition = 'right' }: ToolbarButtonProps) => {
    const activeClass = active ? 'toolbar-button--active' : '';

    return (
        <Tooltip content={tooltip} position={tooltipPosition}>
            <button
                type='button'
                aria-label={tooltip}
                onClick={onClick}
                className={`toolbar-button w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer ${activeClass}`}
            >
                <i className={`${icon} text-lg`} />
            </button>
        </Tooltip>
    );
};
