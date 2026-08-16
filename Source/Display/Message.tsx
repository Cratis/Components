// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Message as PrimeMessage } from 'primereact/message';

/** Severity tone of a {@link Message}. */
export type MessageSeverity = 'info' | 'success' | 'warn' | 'error' | 'secondary' | 'contrast';

/** Props for {@link Message}. */
export interface MessageProps {
    /** Severity tone (drives the color). */
    severity?: MessageSeverity;
    /** The message text. */
    text?: React.ReactNode;
    /** Message content (alternative to {@link text}). */
    children?: React.ReactNode;
    /** Extra class name applied to the message root. */
    className?: string;
}

/**
 * A declarative inline message built on PrimeReact 11's compositional `Message` parts.
 *
 * PrimeReact 10's `<Message severity text />` became `Message.Root` + `Message.Content` +
 * `Message.Text` in 11; this preserves the flat call shape so an inline notice stays a
 * single element at the call site.
 */
export const Message = ({ severity = 'info', text, children, className }: MessageProps) => (
    <PrimeMessage.Root severity={severity} className={className}>
        <PrimeMessage.Content>
            <PrimeMessage.Text>{children ?? text}</PrimeMessage.Text>
        </PrimeMessage.Content>
    </PrimeMessage.Root>
);
