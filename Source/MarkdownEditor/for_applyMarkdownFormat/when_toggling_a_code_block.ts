// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyMarkdownFormat } from '../applyMarkdownFormat';
import { MarkdownFormat } from '../MarkdownFormat';

const fence = '```';

describe('when toggling a code block', () => {
    describe('around lines without one', () => {
        const result = applyMarkdownFormat('before\nlet x = 1;\nafter', 7, 17, MarkdownFormat.CodeBlock);

        it('should fence the lines', () => result.value.should.equal(`before\n${fence}\nlet x = 1;\n${fence}\nafter`));
        it('should select the fenced content', () =>
            result.value.slice(result.selectionStart, result.selectionEnd).should.equal('let x = 1;'));
    });

    describe('around lines that already are one', () => {
        const markdown = `${fence}\nlet x = 1;\n${fence}`;
        const result = applyMarkdownFormat(markdown, 0, markdown.length, MarkdownFormat.CodeBlock);

        it('should take the fences off', () => result.value.should.equal('let x = 1;'));
    });

    describe('on an empty line', () => {
        const result = applyMarkdownFormat('', 0, 0, MarkdownFormat.CodeBlock);

        it('should put in an empty block', () => result.value.should.equal(`${fence}\n\n${fence}`));
        it('should leave the caret inside it', () => result.selectionStart.should.equal(4));
    });
});
