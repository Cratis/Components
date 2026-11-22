// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Controlled data rendered by {@link Note}. */
export interface NoteData {
    /** Stable note identity. */
    id: string;
    /** World-space horizontal position. */
    x: number;
    /** World-space vertical position. */
    y: number;
    /** Note width. */
    width: number;
    /** Note height. */
    height: number;
    /** Editable note text. */
    text: string;
}
