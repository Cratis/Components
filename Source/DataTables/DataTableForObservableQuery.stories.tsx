// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import * as Comp from './DataTableForObservableQuery.tsx';
// @ts-ignore
const Component: unknown = (Comp as unknown).default || Object.values(Comp)[0];

export default { title: 'DataTables/DataTableForObservableQuery', component: Component };

export const Default = () => (Component ? <Component /> : <div>Unable to render component</div>);
