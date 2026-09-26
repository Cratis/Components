// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { CommandStepper } from '../../CommandStepper';

const submission = vi.hoisted(() => ({
    start: undefined as (() => Promise<void>) | undefined,
    isSubmitting: false,
    executeCalls: 0,
}));

vi.mock('../../CommandStepperContent', () => ({
    CommandStepperContent: (props: { onSubmit?: () => Promise<void>; isSubmitting?: boolean }) => {
        submission.start = props.onSubmit;
        submission.isSubmitting = props.isSubmitting ?? false;
        return React.createElement('div');
    },
}));

vi.mock('@cratis/arc.react/commands', () => {
    const context = {
        isValid: true,
        setCommandValues: () => { },
        setCommandResult: () => { },
        getFieldError: () => undefined,
    };
    const command = {
        execute: () => {
            submission.executeCalls += 1;
            return Promise.resolve({ isSuccess: true, response: {} });
        },
    };
    return {
        CommandForm: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
        useCommandFormContext: () => context,
        useCommandInstance: () => command,
    };
});

class SampleCommand {
    name = '';
}

describe('when an inline stepper async transform rejects', () => {
    let root: Root;
    let container: HTMLDivElement;
    let rejectTransform: (reason: Error) => void;
    let wasBusyWhilePending: boolean;
    let isBusyAfterRejection: boolean;
    let receivedError: unknown;
    let executeCalls: number;
    const transformError = new Error('Example transform failed');

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        submission.executeCalls = 0;
        receivedError = undefined;
        const pendingTransform = new Promise<SampleCommand>((_resolve, reject) => {
            rejectTransform = reject;
        });
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        await act(async () => {
            root.render(React.createElement(CommandStepper<SampleCommand>, {
                command: SampleCommand as unknown as new () => object,
                onBeforeExecute: () => pendingTransform,
            }));
        });

        await act(async () => {
            void submission.start?.().catch((error: unknown) => { receivedError = error; });
        });
        wasBusyWhilePending = submission.isSubmitting;
        await act(async () => rejectTransform(transformError));
        isBusyAfterRejection = submission.isSubmitting;
        executeCalls = submission.executeCalls;
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should be busy while awaiting the transform', () => {
        wasBusyWhilePending.should.be.true;
    });

    it('should reset busy state after the transform rejects', () => {
        isBusyAfterRejection.should.be.false;
    });

    it('should propagate the transform error without executing the command', () => {
        receivedError.should.equal(transformError);
        executeCalls.should.equal(0);
    });
});
