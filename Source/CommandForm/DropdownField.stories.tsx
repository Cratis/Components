import React from 'react';
import * as Comp from './DropdownField.tsx';
// @ts-ignore
const Component: any = (Comp as any).default || Object.values(Comp)[0];

export default { title: 'CommandForm/DropdownField', component: Component };

export const Default = () => (Component ? <Component /> : <div>Unable to render component</div>);
