// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(new URL('../Toolbar.css', import.meta.url), 'utf8');

describe('when scoping grouped toolbar chrome', () => {
    it('should make the outer toolbar transparent only for direct ToolbarGroup children', () => {
        expect(styles).toContain('.toolbar:has(> .toolbar-group)');
        expect(styles).not.toContain('.toolbar:has(.toolbar-group)');
    });
});
