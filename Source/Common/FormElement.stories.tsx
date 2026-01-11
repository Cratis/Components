// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import * as Comp from './FormElement';
const Component: React.ComponentType<Record<string, never>> | undefined = (Comp as Record<string, unknown>).default as unknown as React.ComponentType<Record<string, never>> | undefined || (Object.values(Comp)[0] as unknown as React.ComponentType<Record<string, never>> | undefined);

export default { title: 'Common/FormElement', component: Component };

export const Default = () => (Component ? <Component /> : <div>Unable to render component</div>);
