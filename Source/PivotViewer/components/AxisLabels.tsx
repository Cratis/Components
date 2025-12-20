// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import type { PivotGroup } from '../types';
import { GROUP_SPACING } from '../constants';

export interface AxisLabelsProps<TItem extends object> {
  groups: PivotGroup<TItem>[];
  bucketWidths: number[];
  dimensionFilter: string | null;
  hoveredGroup: string | null;
  zoomLevel: number;
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
  onHover,
  onClick,
  containerRef,
}: AxisLabelsProps<TItem>) {
  return (
    <div
      className="pv-axis-labels"
      ref={containerRef}
      style={{
        pointerEvents: 'none',
        gap: `${GROUP_SPACING * zoomLevel}px`,
        paddingLeft: 0,
        paddingRight: 0,
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

        return (
          <button
            key={group.key}
            type="button"
            className={`pv-axis-label ${hoveredGroup === group.key ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}`}
            style={{
              width,
              pointerEvents: 'auto'
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
