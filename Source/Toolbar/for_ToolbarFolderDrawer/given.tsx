// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ToolbarDrawerItem } from '../ToolbarDrawerItem';

/** Synthetic catalogue used by the drawer specs. Identities and payloads are deliberately distinct. */
export const layoutItems: ToolbarDrawerItem[] = [
    { id: 'stack', title: 'Stack', icon: <span>S</span>, payload: { kind: 'stack', options: { gap: 1 } } },
    { id: 'row', title: 'Row', icon: <span>R</span>, payload: { kind: 'row' } },
    { id: 'masonry', title: 'Masonry', icon: <span>M</span>, payload: { kind: 'masonry', columns: 3 } },
    {
        id: 'frozen',
        title: 'Frozen',
        icon: <span>F</span>,
        payload: { kind: 'frozen' },
        disabled: true,
        disabledReason: 'Not available inside a template',
    },
];
