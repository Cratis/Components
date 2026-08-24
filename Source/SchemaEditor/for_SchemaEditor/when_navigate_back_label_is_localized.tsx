// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema } from '../../types/JsonSchema';

/**
 * Regression coverage for a confirmed bypass: the back-navigation button passed a hardcoded
 * `'Navigate back'` literal as the `Tooltip` `content`, while the very same button's
 * `aria-label` correctly resolved through `labels.navigateBack`. A caller that localized
 * `navigateBack` still saw an English tooltip. Both must resolve from the same source.
 */
describe('when the navigate-back label is localized', () => {
    let container: HTMLDivElement;
    let root: Root;
    let backButton: HTMLButtonElement;

    const schema: JsonSchema = {
        type: 'object',
        properties: {
            address: {
                type: 'object',
                properties: {
                    city: { type: 'string' },
                },
            },
        },
    };

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };

        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <SchemaEditor
                    schema={schema}
                    labels={{ navigateBack: 'Naviger tilbake' }}
                />,
            );
        });

        // Navigate into the nested "address" object so the back button becomes enabled.
        const row = container.querySelector<HTMLTableRowElement>(
            '[data-cratis-part="row"]',
        );
        if (!row) throw new Error('SchemaEditor did not render a navigable row.');
        await act(async () => {
            row.click();
        });

        const renderedBackButton = container.querySelector<HTMLButtonElement>(
            'button[aria-label="Naviger tilbake"]',
        );
        if (!renderedBackButton) {
            throw new Error('SchemaEditor did not render the localized back button.');
        }
        backButton = renderedBackButton;
        await act(async () => backButton.focus());
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should carry the localized label as its accessible name', () => {
        expect(backButton.getAttribute('aria-label')).to.equal('Naviger tilbake');
    });

    it('should carry the same localized label as its tooltip content', () => {
        const descriptionId = backButton.getAttribute('aria-describedby');
        expect(descriptionId).not.to.equal(null);
        expect(document.getElementById(descriptionId ?? '')?.textContent).to.equal(
            'Naviger tilbake',
        );
    });

    it('should never fall back to the hardcoded English tooltip literal', () => {
        const descriptionId = backButton.getAttribute('aria-describedby');
        expect(document.getElementById(descriptionId ?? '')?.textContent).not.to.equal(
            'Navigate back',
        );
    });
});
