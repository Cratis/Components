// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Published over the Arc messenger by a {@link Note} when an edit is committed (the editor loses
 * focus) — the same moment the `onTextChange` callback fires, never per keystroke. Carries the full
 * committed text, not a delta.
 */
export class NoteTextChanged {
    constructor(
        readonly noteId: string,
        readonly text: string,
    ) {}
}
