// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes } from 'react';

/** Attributes passed through to one part of a configuration editor, including `data-*` attributes. */
export type ConfigurationEditorPartAttributes<TElement> = HTMLAttributes<TElement> & {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
};
