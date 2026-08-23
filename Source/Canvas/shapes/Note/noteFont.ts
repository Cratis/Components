// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A specimen of the embedded note face (declared in Note.css) — the size is irrelevant to
 * `FontFaceSet.load`, only the family matters. */
const SPECIMEN = '16px "Patrick Hand"';

let ready: Promise<void> | null = null;

/**
 * Resolves once the embedded note font is usable for measurement.
 *
 * The note text is sized by measuring it, and a webfont arrives asynchronously: a measurement taken
 * before it loads uses the fallback face's metrics, so the fitted size is wrong for the face that
 * ends up painting. Notes must re-measure once the real face is in — hence one shared promise for
 * every note on the board rather than a load per note.
 */
export function whenNoteFontReady(): Promise<void> {
    if (ready) return ready;
    const fonts = typeof document === 'undefined' ? undefined : document.fonts;
    // A failed/unsupported load is not an error worth surfacing — the fallback face still renders,
    // it just measures against different metrics.
    ready = fonts ? fonts.load(SPECIMEN).then(() => undefined, () => undefined) : Promise.resolve();
    return ready;
}
