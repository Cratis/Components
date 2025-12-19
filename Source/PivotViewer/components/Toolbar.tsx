import type { PivotDimension } from '../types';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../utils/utils';

export type ViewMode = 'collection' | 'grouped';

export interface ToolbarProps<TItem extends object> {
  hasFilters: boolean;
  filtersOpen: boolean;
  filteredCount: number;
  viewMode: ViewMode;
  zoomLevel: number;
  activeDimensionKey: string;
  dimensions: PivotDimension<TItem>[];
  activeFilterCount: number;
  onFiltersToggle: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomSlider: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDimensionChange: (key: string) => void;
  filterButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export function Toolbar<TItem extends object>({
  hasFilters,
  filtersOpen,
  filteredCount,
  viewMode,
  zoomLevel,
  activeDimensionKey,
  dimensions,
  activeFilterCount,
  onFiltersToggle,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onZoomSlider,
  onDimensionChange,
  filterButtonRef,
}: ToolbarProps<TItem>) {
  const labelText = 'Sort by';

  return (
    <header className="pv-toolbar">
      <div className="pv-toolbar-left">
        {hasFilters && (
          <button
            ref={filterButtonRef}
            type="button"
            className={`pv-filter-icon-button ${filtersOpen ? 'active' : ''}`}
            onClick={onFiltersToggle}
            title="Filters"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="pv-filter-badge">{activeFilterCount}</span>
            )}
          </button>
        )}
        <h1>Pivot Viewer</h1>
        <span className="pv-count">{filteredCount} events</span>
      </div>
      <div className="pv-toolbar-right">
        <div className="pv-zoom-controls">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoomLevel <= ZOOM_MIN}
            title="Zoom out"
          >
            −
          </button>
          <input
            type="range"
            className="pv-zoom-slider"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoomLevel}
            onChange={onZoomSlider}
            title={`Zoom: ${Math.round(zoomLevel * 100)}%`}
          />
          <span className="pv-zoom-level">{Math.round(zoomLevel * 100)}%</span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoomLevel >= ZOOM_MAX}
            title="Zoom in"
          >
            +
          </button>
        </div>
        <div className="pv-view-toggle">
          <button
            type="button"
            className={viewMode === 'collection' ? 'active' : ''}
            onClick={() => onViewModeChange('collection')}
          >
            Collection
          </button>
          <button
            type="button"
            className={viewMode === 'grouped' ? 'active' : ''}
            onClick={() => onViewModeChange('grouped')}
          >
            Buckets
          </button>
        </div>
        <label className="pv-dimension-select">
          <span>{labelText}</span>
          <select
            value={activeDimensionKey}
            onChange={(event) => onDimensionChange(event.target.value)}
          >
            {dimensions.map((dimension) => (
              <option key={dimension.key} value={dimension.key}>
                {dimension.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
