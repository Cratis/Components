// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DialogHeaderActionsRenderer } from '../configuration/DialogHeaderActionsRenderer';
import type { DialogHeaderContext } from '../configuration/DialogHeaderContext';

/** Mounts the app-wide renderer as a component so the actions it returns can use hooks. */
export const DialogGlobalHeaderActions = ({
    render,
    context,
}: {
    render: DialogHeaderActionsRenderer;
    context: DialogHeaderContext;
}) => <>{render(context)}</>;
