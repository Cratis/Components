// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  FilterDefinition,
  FilterValues,
  RangeValues,
  CustomFilterValues,
} from './types';
import { RangeHistogramFilter } from './RangeHistogramFilter';
import './FilterPanel.css';

export interface FilterPanelProps {
  /** Whether the panel is visible. */
  isOpen: boolean;
  /** Filter definitions, each describing one filter group. */
  filters: FilterDefinition[];
  /** Current string/option selections, keyed by FilterDefinition.key. */
  filterValues: FilterValues;
  /** Current numeric range selections, keyed by FilterDefinition.key. */
  rangeValues: RangeValues;
  /** Current values for filters using renderEditor, keyed by FilterDefinition.key. */
  customValues?: CustomFilterValues;
  /** Current search text shown in the search box. */
  search?: string;
  /** Placeholder text for the search input. Defaults to 'Search…'. */
  searchPlaceholder?: string;
  /** Which filter group is currently expanded. */
  expandedFilterKey?: string | null;
  /** The button element the panel anchors below. */
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  /** Called when the panel should close (e.g. click outside). */
  onClose: () => void;
  /** Called when the search text changes. If omitted, the search box is hidden. */
  onSearchChange?: (value: string) => void;
  /** Called when a string option is toggled. */
  onFilterToggle: (filterKey: string, optionKey: string, multi: boolean) => void;
  /** Called when all selections for a filter are cleared. */
  onFilterClear: (filterKey: string) => void;
  /** Called when a numeric range changes. */
  onRangeChange: (filterKey: string, range: [number, number] | null) => void;
  /** Called when the expanded filter group changes. */
  onExpandedFilterChange: (key: string | null) => void;
  /** Called when a custom-editor value changes. */
  onCustomValueChange?: (filterKey: string, value: unknown) => void;
}

function renderOptionCount(count: number | undefined): string | number {
  return typeof count === 'number' ? count : '';
}

export function FilterPanel({
  isOpen,
  filters,
  filterValues,
  rangeValues,
  customValues,
  search,
  searchPlaceholder = 'Search…',
  expandedFilterKey,
  anchorRef,
  onClose,
  onSearchChange,
  onFilterToggle,
  onFilterClear,
  onRangeChange,
  onExpandedFilterChange,
  onCustomValueChange,
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen, anchorRef]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const panel = panelRef.current;
      const anchor = anchorRef.current;

      if (panel && !panel.contains(target) && anchor && !anchor.contains(target)) {
        onClose();
      }
    };

    // Use capture phase to ensure we catch the event before any other handlers.
    // Use timeout to avoid closing immediately when clicking the button to open.
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, anchorRef, onClose]);

  return createPortal(
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          ref={panelRef}
          className="pv-filter-dropdown"
          style={{
            position: 'fixed',
            left: position.left,
            top: position.top,
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          <div className="pv-filter-dropdown-content">
            {onSearchChange && (
              <div className="pv-search">
                <input
                  type="search"
                  placeholder={searchPlaceholder}
                  value={search ?? ''}
                  onChange={(event) => onSearchChange(event.target.value)}
                />
              </div>
            )}
            <div className="pv-filter-groups">
              {filters.map((filter) => {
                const selections = filterValues[filter.key] ?? new Set<string>();
                const rangeSelection = rangeValues[filter.key];
                const customValue = customValues?.[filter.key];
                const isExpanded = expandedFilterKey === filter.key;
                const isNumeric = filter.type === 'number';
                const isCustom = filter.type === 'custom' || filter.renderEditor !== undefined;

                return (
                  <div key={filter.key} className={`pv-filter ${isExpanded ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      className="pv-filter-trigger"
                      onClick={() => onExpandedFilterChange(isExpanded ? null : filter.key)}
                    >
                      <span className="pv-filter-label">{filter.label}</span>
                      <span className="pv-filter-trigger-meta">
                        {!isNumeric && !isCustom && selections.size > 0 && (
                          <span className="pv-filter-count">{selections.size}</span>
                        )}
                        {isNumeric && rangeSelection && (
                          <span className="pv-filter-count">Range</span>
                        )}
                        {isCustom && customValue !== undefined && customValue !== null && (
                          <span className="pv-filter-count">•</span>
                        )}
                        <span className="pv-filter-chevron" />
                      </span>
                    </button>
                    <div className={`pv-filter-content ${isExpanded ? 'expanded' : ''}`}>
                      {isCustom && filter.renderEditor ? (
                        filter.renderEditor({
                          value: customValue,
                          onChange: (value) => onCustomValueChange?.(filter.key, value),
                        })
                      ) : isNumeric && filter.numericRange ? (
                        <RangeHistogramFilter
                          values={filter.numericRange.values}
                          min={filter.numericRange.min}
                          max={filter.numericRange.max}
                          buckets={filter.buckets ?? 20}
                          selectedRange={rangeSelection ?? null}
                          onChange={(range) => onRangeChange(filter.key, range)}
                        />
                      ) : (
                        <>
                          <ul>
                            {(filter.options ?? []).map((option) => {
                              const optionKey = option.key;
                              const checked = selections.has(optionKey);
                              return (
                                <li key={option.key}>
                                  <label>
                                    <input
                                      type={filter.multi ? 'checkbox' : 'radio'}
                                      name={`filter-${filter.key}`}
                                      checked={checked}
                                      onChange={() =>
                                        onFilterToggle(filter.key, optionKey, filter.multi ?? false)
                                      }
                                    />
                                    <span>{option.label}</span>
                                    <span className="pv-option-count">{renderOptionCount(option.count)}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                          {selections.size > 0 && (
                            <button
                              type="button"
                              className="pv-filter-clear"
                              onClick={() => onFilterClear(filter.key)}
                            >
                              Clear
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body
  );
}
