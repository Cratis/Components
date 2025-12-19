import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Version } from './types';
import { ReadModelView } from './ReadModelView';
import { EventsView } from './EventsView';
import './TimeMachine.css';

type ViewMode = 'readmodel' | 'events';

interface TimeMachineProps {
  versions: Version[];
  currentVersionIndex?: number;
  onVersionChange?: (index: number) => void;
  /** Scroll sensitivity - higher values require more scrolling to change versions */
  scrollSensitivity?: number;
}

export const TimeMachine: React.FC<TimeMachineProps> = ({
  versions,
  currentVersionIndex = 0,
  onVersionChange,
  scrollSensitivity = 50,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(currentVersionIndex);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('readmodel');
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAccumulatorRef = useRef(0);

  const handleVersionSelect = useCallback((index: number) => {
    setSelectedIndex(index);
    onVersionChange?.(index);
  }, [onVersionChange]);

  const handleTimelineHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  // Handle trackpad two-finger scroll gesture
  useEffect(() => {
    if (viewMode !== 'readmodel') {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle navigation when not hovering over a card
      if (isHoveringCard) {
        return; // Allow normal scrolling within cards
      }

      // Prevent default scrolling behavior
      e.preventDefault();

      // Use deltaX for horizontal scroll, fallback to deltaY for vertical
      // Most trackpads send horizontal delta for two-finger swipe
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

      // Accumulate scroll delta
      scrollAccumulatorRef.current += delta;

      // Check if we've accumulated enough scroll to change version
      if (Math.abs(scrollAccumulatorRef.current) >= scrollSensitivity) {
        const direction = scrollAccumulatorRef.current > 0 ? 1 : -1;
        const newIndex = Math.max(0, Math.min(versions.length - 1, selectedIndex + direction));

        if (newIndex !== selectedIndex) {
          setSelectedIndex(newIndex);
          onVersionChange?.(newIndex);
        }

        // Reset accumulator after version change
        scrollAccumulatorRef.current = 0;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [versions.length, selectedIndex, onVersionChange, scrollSensitivity, isHoveringCard, viewMode]);

  // Calculate the display index - either hovered or selected
  const displayIndex = hoveredIndex ?? selectedIndex;

  // Get all events from all versions
  const allEvents = versions.flatMap(version => version.events || []);

  return (
    <div className="time-machine" ref={containerRef}>
      {/* View Switcher */}
      <div className="view-switcher">
        <button
          className={`view-button ${viewMode === 'readmodel' ? 'active' : ''}`}
          onClick={() => setViewMode('readmodel')}
          aria-label="Read Model View"
          title="Read Model View"
        >
          <i className="pi pi-box" />
        </button>
        <button
          className={`view-button ${viewMode === 'events' ? 'active' : ''}`}
          onClick={() => setViewMode('events')}
          aria-label="Events View"
          title="Events View"
        >
          <i className="pi pi-list" />
        </button>
      </div>

      {/* Render the appropriate view */}
      {viewMode === 'readmodel' ? (
        <ReadModelView
          versions={versions}
          selectedIndex={selectedIndex}
          hoveredIndex={hoveredIndex}
          onVersionSelect={handleVersionSelect}
          onHoveringCardChange={setIsHoveringCard}
        />
      ) : (
        <EventsView events={allEvents} />
      )}

      {/* Timeline - only show in ReadModel view */}
      {viewMode === 'readmodel' && (
        <Timeline
          versions={versions}
          selectedIndex={selectedIndex}
          hoveredIndex={hoveredIndex}
          onSelect={handleVersionSelect}
          onHover={handleTimelineHover}
        />
      )}

      {/* Navigation arrows - only show in ReadModel view */}
      {viewMode === 'readmodel' && (
        <div className="navigation-controls">
          <button
            className="nav-button prev"
            disabled={selectedIndex === 0}
            onClick={() => handleVersionSelect(Math.max(0, selectedIndex - 1))}
            aria-label="Previous version"
          >
            ‹
          </button>
          <button
            className="nav-button next"
            disabled={selectedIndex === versions.length - 1}
            onClick={() => handleVersionSelect(Math.min(versions.length - 1, selectedIndex + 1))}
            aria-label="Next version"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

interface TimelineProps {
  versions: Version[];
  selectedIndex: number;
  hoveredIndex: number | null;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  versions,
  selectedIndex,
  hoveredIndex,
  onSelect,
  onHover,
}) => {
  const getMagnification = (index: number, hoverIdx: number | null): number => {
    if (hoverIdx === null) return 1;
    const distance = Math.abs(index - hoverIdx);
    // Fish-eye effect: items close to hover get magnified
    if (distance === 0) return 2.0;
    if (distance === 1) return 1.6;
    if (distance === 2) return 1.3;
    if (distance === 3) return 1.1;
    return 1;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      className="timeline"
      onMouseLeave={() => onHover(null)}
    >
      <div className="timeline-track">
        {versions.map((version, index) => {
          const magnification = getMagnification(index, hoveredIndex);
          const isSelected = index === selectedIndex;
          const isHovered = index === hoveredIndex;

          return (
            <div
              key={version.id}
              className={`timeline-entry ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
              style={{
                '--magnification': magnification,
              } as React.CSSProperties}
              onMouseEnter={() => onHover(index)}
              onClick={() => onSelect(index)}
            >
              <div className="timeline-tick"></div>
              <div className="timeline-label">
                <span className="timeline-date">{formatDate(version.timestamp)}</span>
                <span className="timeline-time">{formatTime(version.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeMachine;
