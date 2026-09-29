// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DataTableFilterMatchMode } from '../DataTableFilterMeta';
import { firstConstraint, matchesFilterEntry } from '../matchesFilterEntry';

describe('when matching a constraint with no filter value', () => {
    it('should match every value', () => {
        matchesFilterEntry('anything', { value: '', matchMode: DataTableFilterMatchMode.Equals }).should.be.true;
    });
});

describe('when matching text without a match mode', () => {
    it('should match values that contain the text, ignoring case', () => {
        matchesFilterEntry('Example Project', { value: 'project' }).should.be.true;
        matchesFilterEntry('Example Project', { value: 'sample' }).should.be.false;
    });
});

describe('when matching constraints combined with or', () => {
    const entry = {
        operator: 'or',
        constraints: [
            { value: 'Ex', matchMode: DataTableFilterMatchMode.StartsWith },
            { value: 'User', matchMode: DataTableFilterMatchMode.EndsWith },
        ],
    };
    it('should match when either constraint matches', () => {
        matchesFilterEntry('Sample User', entry).should.be.true;
        matchesFilterEntry('Demo Assistant', entry).should.be.false;
    });
});

describe('when matching constraints combined with and', () => {
    const entry = {
        operator: 'and',
        constraints: [
            { value: 'Ex', matchMode: DataTableFilterMatchMode.StartsWith },
            { value: 'Project', matchMode: DataTableFilterMatchMode.EndsWith },
        ],
    };
    it('should match only when every constraint matches', () => {
        matchesFilterEntry('Example Project', entry).should.be.true;
        matchesFilterEntry('Example User', entry).should.be.false;
    });
});

describe('when matching an entry with no constraints', () => {
    it('should match every value', () => {
        matchesFilterEntry('anything', { operator: 'and', constraints: [] }).should.be.true;
    });
});

describe('when matching a number between two bounds', () => {
    it('should include both bounds', () => {
        const entry = { value: [2, 4], matchMode: DataTableFilterMatchMode.Between };
        [1, 2, 4, 5].map((value) => matchesFilterEntry(value, entry)).should.deep.equal([false, true, true, false]);
    });
});

describe('when matching dates', () => {
    const filter = new Date(2024, 4, 17, 8, 0, 0, 0);
    const filterTime = filter.getTime();
    const value = new Date(2024, 4, 17, 20, 0, 0, 0);
    const valueTime = value.getTime();
    const matched = matchesFilterEntry(value, { value: filter, matchMode: DataTableFilterMatchMode.DateIs });

    it('should compare by day', () => {
        matched.should.be.true;
    });
    it('should not change the caller-owned dates', () => {
        filter.getTime().should.equal(filterTime);
        value.getTime().should.equal(valueTime);
    });
});

describe('when taking the first constraint of an entry', () => {
    it('should return the constraint itself or the first of several', () => {
        const constraint = { value: 'a' };
        firstConstraint(constraint)!.should.equal(constraint);
        firstConstraint({ operator: 'or', constraints: [constraint, { value: 'b' }] })!.should.equal(constraint);
        (firstConstraint(undefined) === undefined).should.be.true;
    });
});
