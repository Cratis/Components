import React from 'react';
import * as Comp from './RangeHistogramFilter.tsx';
// @ts-ignore
const Component: any = (Comp as any).default || Object.values(Comp)[0];

export default { title: 'PivotViewerOptimized/components/RangeHistogramFilter', component: Component };

export const Default = () => (Component ? <Component /> : <div>Unable to render component</div>);
