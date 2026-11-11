// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { vi } from 'vitest';
import type { JsonSchemaProperty } from '../../../types/JsonSchema';
import type { TypeFormat } from '../../../types/TypeFormat';
import { defaultSchemaEditorLabels } from '../../defaultSchemaEditorLabels';
import { TableMount } from '../../for_SchemaEditor/TableMount';
import { TypeCell, type TypeCellProps } from '../../TypeCell';

export const formats: TypeFormat[] = [
    { jsonType: 'string', format: '' },
    { jsonType: 'string', format: 'guid' },
    { jsonType: 'integer', format: '' },
];

/** Mounts a TypeCell with spy callbacks and drives its dropdowns the way a person would. */
export class a_type_cell {
    private current: TableMount | undefined;

    get mount() {
        this.current ??= new TableMount();
        return this.current;
    }


    readonly onUpdateProperty = vi.fn();
    readonly onUpdateArrayItemType = vi.fn();
    readonly onNavigateToProperty = vi.fn();
    readonly onNavigateToArrayItems = vi.fn();
    readonly onRemoveProperty = vi.fn();

    async render(rowData: JsonSchemaProperty, options: Partial<TypeCellProps> = {}) {
        await this.mount.render(
            <TypeCell
                rowData={rowData}
                isEditMode
                typeFormats={[]}
                onUpdateProperty={this.onUpdateProperty}
                onUpdateArrayItemType={this.onUpdateArrayItemType}
                onNavigateToProperty={this.onNavigateToProperty}
                onNavigateToArrayItems={this.onNavigateToArrayItems}
                onRemoveProperty={this.onRemoveProperty}
                labels={defaultSchemaEditorLabels}
                {...options}
            />,
        );
    }

    get html() {
        return this.mount.container.innerHTML;
    }

    get text() {
        return this.mount.container.textContent;
    }

    async choose(ariaLabel: string, optionText: string) {
        await act(async () => this.mount.container.querySelector<HTMLElement>(`[aria-label="${ariaLabel}"]`)!.click());
        const option = Array.from(document.querySelectorAll<HTMLElement>('[data-cratis-part="option"]'))
            .find(candidate => candidate.textContent === optionText);
        await act(async () => option!.click());
    }

    ariaLabels() {
        return Array.from(this.mount.container.querySelectorAll('button')).map(button => button.getAttribute('aria-label'));
    }

    async unmount() {
        await this.current?.unmount();
        this.current = undefined;
        [this.onUpdateProperty, this.onUpdateArrayItemType, this.onNavigateToProperty, this.onNavigateToArrayItems, this.onRemoveProperty].forEach(spy => spy.mockClear());
    }
}
