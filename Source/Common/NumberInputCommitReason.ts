// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Interaction that committed a {@link NumberInput} edit. */
export enum NumberInputCommitReason {
    /** Focus left the editable input. */
    Blur = 'blur',
    /** The Enter key committed the editable text. */
    Enter = 'enter',
    /** A full-field paste committed immediately. */
    Paste = 'paste',
    /** An arrow key or step button changed and committed the value. */
    Step = 'step',
}
