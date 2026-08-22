// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import {
    attachDataTableFilterMatcherAdapter,
    registerDataTableFilterMatcher,
    unregisterDataTableFilterMatcher,
} from '../DataTableFilterMatcherRegistry';

describe('when registering custom matchers', () => {
    it('should reject a built-in match-mode name', () => {
        expect(() => registerDataTableFilterMatcher('contains', () => true)).to.throw(
            "'contains' is a built-in data-table filter match mode",
        );
    });

    it('should reject a different matcher with the same process-wide name', () => {
        const registration = registerDataTableFilterMatcher('collision-test', () => true);
        try {
            expect(() =>
                registerDataTableFilterMatcher('collision-test', () => false),
            ).to.throw("already registered as 'collision-test'");
        } finally {
            unregisterDataTableFilterMatcher(registration);
        }
    });

    it('should synchronize every attached rendering adapter', () => {
        const first: string[] = [];
        const second: string[] = [];
        attachDataTableFilterMatcherAdapter({
            register: (name) => first.push(`add:${name}`),
            unregister: (name) => first.push(`remove:${name}`),
        });
        attachDataTableFilterMatcherAdapter({
            register: (name) => second.push(`add:${name}`),
            unregister: (name) => second.push(`remove:${name}`),
        });

        const registration = registerDataTableFilterMatcher(
            'multi-adapter-test',
            () => true,
        );
        unregisterDataTableFilterMatcher(registration);

        expect(first).to.deep.equal([
            'add:multi-adapter-test',
            'remove:multi-adapter-test',
        ]);
        expect(second).to.deep.equal([
            'add:multi-adapter-test',
            'remove:multi-adapter-test',
        ]);
    });

    it('should retain a shared matcher until every owner unregisters', () => {
        const matcher = () => true;
        const first = registerDataTableFilterMatcher('shared-test', matcher);
        const second = registerDataTableFilterMatcher('shared-test', matcher);
        unregisterDataTableFilterMatcher(first);

        expect(() => registerDataTableFilterMatcher('shared-test', () => false)).to.throw(
            "already registered as 'shared-test'",
        );

        unregisterDataTableFilterMatcher(second);
        const replacement = registerDataTableFilterMatcher('shared-test', () => false);
        unregisterDataTableFilterMatcher(replacement);
    });
});
