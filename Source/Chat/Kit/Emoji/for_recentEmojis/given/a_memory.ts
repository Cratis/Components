// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { EmojiMemory } from '../../EmojiMemory';

/** A stand-in for the browser's storage that keeps what it is given, and can be told to refuse. */
export class a_memory implements EmojiMemory {
    stored: Record<string, string> = {};
    refuseWrites = false;

    getItem(key: string): string | null {
        return this.stored[key] ?? null;
    }

    setItem(key: string, value: string): void {
        if (this.refuseWrites) throw new Error('The storage quota has been exceeded.');
        this.stored[key] = value;
    }
}
