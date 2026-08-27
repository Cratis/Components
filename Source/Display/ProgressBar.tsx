// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { ProgressBarImplementation } from './ProgressBarImplementation';

/** Props for {@link ProgressBar}. */
export interface ProgressBarProps {
    /** Completion value, 0–100. Ignored in `indeterminate` mode. */
    value?: number;
    /** `determinate` (default) shows {@link value}; `indeterminate` shows a looping animation. */
    mode?: 'determinate' | 'indeterminate';
    /** Whether to render the percentage label. Defaults to `true` (determinate only). */
    showValue?: boolean;
    /** Accessible name. Defaults to `'Progress'`; override to describe the operation. */
    'aria-label'?: string;
    /** Identifies an external element that labels the progress indicator. */
    'aria-labelledby'?: string;
    /** Extra class name. */
    className?: string;
}

const coreProgressBarDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: ProgressBarImplementation,
}) satisfies unstable_SlotDeclaration<'common.progress'>;

/** A horizontal determinate or indeterminate progress indicator. */
export const ProgressBar = (props: ProgressBarProps) => {
    const declaration = unstable_useSlot(
        'common.progress',
        coreProgressBarDeclaration,
    );
    return renderSlot(declaration, props);
};
