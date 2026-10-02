// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { ConfigurationEditorRenderProps } from './ConfigurationEditorRenderProps';

/** Renders the configuration experience of one component type. */
export type ConfigurationEditorRenderer<TValue = never, TContext = never> = (
    props: ConfigurationEditorRenderProps<TValue, TContext>,
) => ReactNode;
