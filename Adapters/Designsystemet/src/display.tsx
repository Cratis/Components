// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type CSSProperties, type Ref } from 'react';
import { Spinner as DsSpinner } from '@digdir/designsystemet-react';
import type { SurfaceProps } from '@cratis/components/Common';
import type { ProgressBarProps } from '@cratis/components/Display';
import { classNames } from './classNames.js';

const trackStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--ds-size-2)',
};

const barStyle: CSSProperties = {
    flex: 1,
    height: 'var(--ds-size-2)',
    borderRadius: 'var(--ds-border-radius-full)',
    background: 'var(--ds-color-neutral-surface-tinted)',
    overflow: 'hidden',
};

const fillStyle = (value: number): CSSProperties => ({
    width: `${value}%`,
    height: '100%',
    background: 'var(--ds-color-accent-base-default)',
});

/**
 * Designsystemet ships no progress bar, so the determinate indicator is a token-styled track and
 * the indeterminate one is the Designsystemet Spinner.
 */
export const DesignsystemetProgressSlot = ({
    value = 0,
    mode = 'determinate',
    showValue = true,
    'aria-label': ariaLabel = 'Progress',
    'aria-labelledby': ariaLabelledBy,
    className,
}: ProgressBarProps) => {
    const boundedValue = Math.min(100, Math.max(0, value));
    const determinate = mode === 'determinate';
    const busy = !determinate || boundedValue < 100;
    return (
        <div
            role='progressbar'
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-valuemin={determinate ? 0 : undefined}
            aria-valuemax={determinate ? 100 : undefined}
            aria-valuenow={determinate ? boundedValue : undefined}
            className={classNames('cratis-designsystemet-progress', className)}
            style={trackStyle}
            data-cratis-part='root'
            data-mode={mode}
            data-busy={busy || undefined}
            data-loading={!determinate || undefined}
        >
            {determinate ? (
                <div style={barStyle} aria-hidden='true' data-cratis-part='indicator'>
                    <div style={fillStyle(boundedValue)} />
                </div>
            ) : (
                <DsSpinner aria-hidden='true' data-cratis-part='indicator' />
            )}
            {determinate && showValue && <span data-cratis-part='label'>{boundedValue}%</span>}
        </div>
    );
};

/**
 * Designsystemet implementation of `common.surface`. The `ds-card` class is applied directly instead
 * of mounting the upstream `Card`, whose effect delegates body clicks to a heading link and would
 * make this non-interactive surface activate it.
 */
export const DesignsystemetSurfaceSlot = forwardRef<HTMLElement, SurfaceProps>(
    function DesignsystemetSurfaceSlot(
        { as: Element = 'div', pt, className, style, ...nativeProps },
        ref,
    ) {
        return (
            <Element
                {...pt?.root}
                {...nativeProps}
                ref={ref as Ref<never>}
                className={classNames('ds-card', 'cratis-designsystemet-surface', pt?.root?.className, className)}
                style={{ ...pt?.root?.style, ...style }}
                data-cratis-part='root'
            />
        );
    },
);
