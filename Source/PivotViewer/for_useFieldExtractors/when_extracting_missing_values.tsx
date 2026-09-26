// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { useFieldExtractors } from '../hooks/useFieldExtractors';
import { buildStore, buildIndexes, computeGrouping } from '../engine/store';
import type { FieldValue } from '../engine/types';
import type { PivotDimension, PivotFilter } from '../types';

interface SampleItem {
    value?: number | Date | null;
}

describe('when extracting missing values for dimensions and filters', () => {
    const dimensions: PivotDimension<SampleItem>[] = [
        { key: 'dimension', label: 'Dimension', getValue: item => item.value },
    ];
    const filters: PivotFilter<SampleItem>[] = [
        { key: 'filter', label: 'Filter', getValue: item => item.value },
    ];
    let extracted: FieldValue[];
    let dateGroups: ReturnType<typeof computeGrouping>['groups'];

    beforeEach(() => {
        extracted = [];
        function Sample() {
            const { fieldExtractors } = useFieldExtractors(dimensions, filters);
            for (const extractor of fieldExtractors.values()) {
                extracted.push(extractor({}), extractor({ value: null }));
            }
            const store = buildStore(
                [{}, { value: new Date('2024-01-01T00:00:00Z') }, { value: new Date('2024-01-02T00:00:00Z') }],
                new Map([['dimension', fieldExtractors.get('dimension')!]]),
            );
            dateGroups = computeGrouping(store, buildIndexes(store, ['dimension']), store.ids, { field: 'dimension' }).groups;
            return null;
        }
        renderToStaticMarkup(<Sample />);
    });

    it('should retain undefined and null in both extractors', () => {
        extracted.should.deep.equal([undefined, null, undefined, null]);
    });

    it('should bucket dates as numeric timestamps after missing values', () => {
        dateGroups.map(group => group.value).should.deep.equal([
            Date.parse('2024-01-01T00:00:00Z'),
            Date.parse('2024-01-02T00:00:00Z') - 86400000 / 10,
        ]);
    });
});
