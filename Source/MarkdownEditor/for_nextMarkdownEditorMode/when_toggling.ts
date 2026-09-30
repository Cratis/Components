// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { MarkdownEditorMode } from '../MarkdownEditorMode';
import { nextMarkdownEditorMode } from '../nextMarkdownEditorMode';

describe('when toggling the mode', () => {
    it('should go from writing to the preview', () =>
        nextMarkdownEditorMode(MarkdownEditorMode.Write).should.equal(MarkdownEditorMode.Preview));
    it('should go from the preview back to writing', () =>
        nextMarkdownEditorMode(MarkdownEditorMode.Preview).should.equal(MarkdownEditorMode.Write));
});
