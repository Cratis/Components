import React from 'react';
import * as Comp from './PivotViewerMain.tsx';
// @ts-ignore
const Component: any = (Comp as any).default || Object.values(Comp)[0];

export default { title: 'PivotViewerOptimized/components/PivotViewerMain', component: Component };

export const Default = () => (Component ? <Component /> : <div>Unable to render component</div>);
