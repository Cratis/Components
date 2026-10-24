// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

const received: Array<{ isNonModal?: boolean }> = [];

vi.mock('@cratis/arc.react/commands', () => ({
    asCommandFormField: (component: ComponentType<Record<string, unknown>>) => component,
}));

vi.mock('../../Common/DatePickerInput', () => ({
    DatePickerInput: (props: { isNonModal?: boolean }) => {
        received.push({ isNonModal: props.isNonModal });
        return null;
    },
}));

import { CalendarField } from '../fields/CalendarField';

describe('when configuring popover modality', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        // SAFETY: React's test-environment flag is intentionally absent from DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        received.length = 0;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const render = async (isNonModal?: boolean) => {
        const Field = CalendarField as unknown as ComponentType<Record<string, unknown>>;
        await act(async () =>
            root.render(
                <Field
                    value={null}
                    onChange={() => undefined}
                    onBlur={() => undefined}
                    errors={[]}
                    isNonModal={isNonModal}
                />,
            ),
        );
        return received.at(-1)!.isNonModal;
    };

    it('should leave the popover modal when omitted', async () => {
        expect(await render()).to.not.equal(true);
    });

    it('should forward isNonModal when true', async () => {
        expect(await render(true)).to.equal(true);
    });

    it('should forward isNonModal when false', async () => {
        expect(await render(false)).to.equal(false);
    });
});
