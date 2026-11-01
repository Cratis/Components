// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { DialogHeaderContext } from './DialogHeaderContext';

/**
 * Renders the app-wide header actions of one dialog. It is mounted as a component, so it may use
 * hooks; return `null` to show nothing for this dialog.
 */
export type DialogHeaderActionsRenderer = (dialog: DialogHeaderContext) => ReactNode;
