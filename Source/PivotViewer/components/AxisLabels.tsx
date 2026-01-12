// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PivotGroup } from '../types';
import { CANVAS_PADDING } from '../constants';

export interface AxisLabelsProps<TItem extends object> {
  groups: PivotGroup<TItem>[];
  bucketWidths: number[];
  dimensionFilter: string | null;
  hoveredGroup: string | null;
  zoomLevel: number;
  visible: boolean;
  onHover: (key: string | null) => void;
  onClick: (key: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function AxisLabels<TItem extends object>({
  groups,
  bucketWidths,
  dimensionFilter,
  hoveredGroup,
  zoomLevel,
  visible,
  onHover,
  onClick,
  containerRef,
}: AxisLabelsProps<TItem>) {
  return (
    <div
      className={`pv-axis-labels ${visible ? 'visible' : 'hidden'}`}
      ref={containerRef}
      style={{
        // Align labels start with grouped buckets using canvas padding scaled by zoom
        paddingLeft: `${(CANVAS_PADDING * zoomLevel)-(20*zoomLevel)}px`,
        overflowX: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {groups.map((group, index) => {
        const isSelected = dimensionFilter === group.key;
        const baseBucketWidth = bucketWidths[index] || 0;
        // Apply zoom to bucket width
        const bucketWidth = baseBucketWidth * zoomLevel;
        // Width is just the bucket width - spacing is handled by CSS gap
        const width = bucketWidth;

        // When a dimension filter is active, mark non-selected groups as filtered-out
        const isFilteredOut = dimensionFilter !== null && !isSelected;

        return (
          <button
            key={group.key}
            type="button"
            className={`pv-axis-label ${hoveredGroup === group.key ? 'highlighted' : ''} ${isSelected ? 'selected' : ''} ${isFilteredOut ? 'filtered-out' : ''}`}
            style={{
              width,
            }}
            onMouseEnter={() => onHover(group.key)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(group.key)}
          >
            <span className="pv-axis-label-text">{group.label}</span>
            <span className="pv-axis-label-count">{group.count ?? group.items.length}</span>
          </button>
        );
      })}
    </div>
  );
}
