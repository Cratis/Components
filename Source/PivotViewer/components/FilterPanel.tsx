// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { PivotFilter, PivotFilterOption, PivotPrimitive } from '../types';
import type { FilterState, RangeFilterState } from '../utils/utils';
import { renderOptionCount } from '../utils/utils';
import { RangeHistogramFilter } from './RangeHistogramFilter';

export interface FilterPanelProps<TItem extends object> {
  isOpen: boolean;
  search: string;
  filterState: FilterState;
  rangeFilterState: RangeFilterState;
  expandedFilterKey: string | null;
  filterOptions: {
    filter: PivotFilter<TItem>;
    options: PivotFilterOption[];
    numericRange?: { min: number; max: number; values: PivotPrimitive[] };
  }[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onFilterToggle: (filterKey: string, optionKey: string, multi: boolean | undefined) => void;
  onFilterClear: (filterKey: string) => void;
  onRangeChange: (filterKey: string, range: [number, number] | null) => void;
  onExpandedFilterChange: (key: string | null) => void;
}

export function FilterPanel<TItem extends object>({
  isOpen,
  search,
  filterState,
  rangeFilterState,
  expandedFilterKey,
  filterOptions,
  anchorRef,
  onClose,
  onSearchChange,
  onFilterToggle,
  onFilterClear,
  onRangeChange,
  onExpandedFilterChange,
}: FilterPanelProps<TItem>) {
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

    // Use capture phase to ensure we catch the event before any other handlers
    // Use timeout to avoid closing immediately when clicking the button to open
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
            <div className="pv-search">
              <input
                type="search"
                placeholder="Search events"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>
            <div className="pv-filter-groups">
              {filterOptions.map(({ filter, options, numericRange }) => {
                const selections = filterState[filter.key] ?? new Set<string>();
                const rangeSelection = rangeFilterState[filter.key];
                const isExpanded = expandedFilterKey === filter.key;
                const isNumeric = filter.type === 'number';

                return (
                  <div key={filter.key} className={`pv-filter ${isExpanded ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      className="pv-filter-trigger"
                      onClick={() => onExpandedFilterChange(isExpanded ? null : filter.key)}
                    >
                      <span className="pv-filter-label">{filter.label}</span>
                      <span className="pv-filter-trigger-meta">
                        {!isNumeric && selections.size > 0 && <span className="pv-filter-count">{selections.size}</span>}
                        {isNumeric && rangeSelection && <span className="pv-filter-count">Range</span>}
                        <span className="pv-filter-chevron" />
                      </span>
                    </button>
                    <div className={`pv-filter-content ${isExpanded ? 'expanded' : ''}`}>
                      {isNumeric && numericRange ? (
                        <RangeHistogramFilter
                          values={numericRange.values}
                          min={numericRange.min}
                          max={numericRange.max}
                          buckets={filter.buckets ?? 20}
                          selectedRange={rangeSelection ?? null}
                          onChange={(range) => onRangeChange(filter.key, range)}
                        />
                      ) : (
                        <>
                          <ul>
                            {options.map((option) => {
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
