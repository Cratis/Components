// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useFieldExtractors } from '../hooks/useFieldExtractors';
import type { PivotDimension } from '../types';
import type { FieldValue } from '../engine/types';

interface SampleItem {
    value: string;
}

describe('when only dimension presentation changes', () => {
    const getValue = (item: SampleItem) => item.value;
    let container: HTMLDivElement;
    let root: Root;
    let fieldExtractors: Array<Map<string, (item: SampleItem) => FieldValue>>;
    let indexFields: string[][];

    function Sample({ dimension }: { dimension: PivotDimension<SampleItem> }) {
        const fields = useFieldExtractors([dimension]);
        fieldExtractors.push(fields.fieldExtractors);
        indexFields.push(fields.indexFields);
        return null;
    }

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        fieldExtractors = [];
        indexFields = [];
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(<Sample dimension={{ key: 'value', label: 'Value', getValue }} />);
        });
        await act(async () => {
            root.render(<Sample dimension={{ key: 'value', label: 'Changed', getValue, formatValue: value => `Value: ${value}`, sort: () => 0 }} />);
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should keep the engine field extractors stable', () => {
        fieldExtractors[1].should.equal(fieldExtractors[0]);
    });

    it('should keep the indexed fields stable', () => {
        indexFields[1].should.equal(indexFields[0]);
    });
});
