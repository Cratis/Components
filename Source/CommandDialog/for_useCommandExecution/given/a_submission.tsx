// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import type { ICommandResult } from '@cratis/arc/commands';
import { useCommandExecution } from '../../useCommandExecution';

export const success = { isSuccess: true, response: {} } as ICommandResult<object>;
export const execute = vi.fn<() => Promise<ICommandResult<object>>>();
export const onException = vi.fn();
export const setCommandValues = vi.fn();
export const command = { name: 'Example', execute };
export type Run = () => Promise<ICommandResult<object> | undefined>;
let root: Root;
let container: HTMLDivElement;
export let run: Run;
export let isBusy = false;
const Harness = (props: {
    transform?: (values: typeof command) => typeof command | Promise<typeof command>;
    guard?: (values: typeof command) => boolean | Promise<boolean>;
    reportException?: boolean;
}) => {
    const submission = useCommandExecution<typeof command, object>(
        command, setCommandValues, props.transform, props.guard, props.reportException === false ? undefined : onException,
    );
    run = submission.run;
    isBusy = submission.isSubmitting;
    return React.createElement('div');
};
export const mount = async (props: React.ComponentProps<typeof Harness> = {}) => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    execute.mockReset().mockResolvedValue(success);
    onException.mockReset(); setCommandValues.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(React.createElement(Harness, props)));
};
export const unmount = async () => {
    await act(async () => root.unmount());
    container.remove();
};
