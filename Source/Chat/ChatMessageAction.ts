// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { ChatMessage } from './ChatMessage';

/**
 * An action a host offers on messages — shown as a button on every message it is available for.
 * The library ships no actions of its own; whatever a message can be turned into (a task, an
 * issue, a document) is the host's business, expressed as descriptors like this one.
 * @typeParam TMessage The host's message type, so {@link onInvoke} receives the full message back.
 */
export interface ChatMessageAction<TMessage extends ChatMessage = ChatMessage> {

    /** Identifies the action among its siblings — used as the rendering key. */
    id: string;

    /** The label, shown as the button's tooltip and accessible name. */
    label: string;

    /** The icon — a PrimeIcons class name such as `'pi pi-bolt'`, or a ready element. */
    icon: string | ReactNode;

    /**
     * Decides which messages the action is offered on. Omit to offer it on all of them.
     * @param message The message the action would apply to.
     * @returns True when the action should be offered.
     */
    isAvailable?: (message: TMessage) => boolean;

    /**
     * Invoked when the action is picked on a message.
     * @param message The message it was picked on.
     */
    onInvoke: (message: TMessage) => void;
}
