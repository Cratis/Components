// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { describeComponent } from '../configuration/identity/describeComponent';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';

/** Severity tone of a {@link Message}. */
export type MessageSeverity =
    'info' | 'success' | 'warn' | 'error' | 'secondary' | 'contrast';

/** Props for {@link Message}. */
export interface MessageProps {
    /** Severity tone (drives the color). */
    severity?: MessageSeverity;
    /** The message text. */
    text?: ReactNode;
    /** Message content (alternative to {@link text}). */
    children?: ReactNode;
    /** Extra class name applied to the message root. */
    className?: string;
    /** The icon shown ahead of the text. Pass `false` for no icon. */
    icon?: ReactNode | false;
    /**
     * Whether the message is its own live region, announced by assistive technology when it
     * appears. Defaults to `true`: `severity="error"` renders `role="alert"`, every other severity
     * `role="status"`. Pass `false` to render a plain element with no role when the message sits
     * inside a live region that already announces it, so it is not announced twice.
     */
    live?: boolean;
}

const severitySymbols: Record<MessageSeverity, string> = {
    info: 'ⓘ',
    success: '✓',
    warn: '⚠',
    error: '⨯',
    secondary: 'ⓘ',
    contrast: 'ⓘ',
};

const messageDescriptor = describeComponent<MessageProps>('Message', [
    { name: 'severity', label: 'Severity', type: 'enum', values: ['info', 'success', 'warn', 'error', 'secondary', 'contrast'] satisfies NonNullable<MessageProps['severity']>[], defaultValue: 'info' },
]);

/** A declarative inline status message. */
export const Message = (props: MessageProps) => {
    const [presentation, marker] = useComponentPresentation(messageDescriptor, props);
    const { severity = 'info', text, children, className, icon, live = true } = presentation;
    return (
        <div
            {...marker}
            className={['cratis-message', className].filter(Boolean).join(' ')}
            data-cratis-part='root'
            data-severity={severity}
            role={live ? (severity === 'error' ? 'alert' : 'status') : undefined}
        >
            {icon !== false && (
                <span
                    className='cratis-message__icon'
                    data-cratis-part='icon'
                    aria-hidden='true'
                >
                    {icon ?? severitySymbols[severity]}
                </span>
            )}
            <span className='cratis-message__text' data-cratis-part='text'>
                {children ?? text}
            </span>
        </div>
    );
};
