// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import { ToolbarDrawerContext } from './ToolbarDrawerContext';
import { ToolbarDrawerTile } from './ToolbarDrawerTile';
import { ToolbarItemVisibilityProvider } from './ToolbarItemVisibilityContext';
import type { ToolbarFolderView } from './useToolbarFolder';

/** Computes the measured drawer variables before the panel's host styles are read. */
export const toolbarFolderDrawerStyle = (view: ToolbarFolderView): CSSProperties => {
    const { isDrawer, columns, placement } = view;
    return isDrawer
        ? ({
              '--toolbar-drawer-columns': columns,
              ...(placement
                  ? {
                        '--toolbar-drawer-shift': `${placement.shift}px`,
                        '--toolbar-drawer-main-shift': `${placement.mainShift}px`,
                        '--toolbar-drawer-max-height': `${placement.maxHeight}px`,
                        '--toolbar-drawer-max-width': `${placement.maxWidth}px`,
                    }
                  : {}),
          } as CSSProperties)
        : {};
};

const renderDrawerHeader = (view: ToolbarFolderView) => {
    const { pt, titleId, resolvedHeading, resolvedCloseLabel, resolvedCloseIcon, close } = view;
    return (
        <div
            {...pt?.drawerHeader}
            className={`toolbar-drawer-header ${pt?.drawerHeader?.className ?? ''}`}
            data-cratis-part='toolbar-folder-header'
        >
            <span
                {...pt?.drawerTitle}
                id={titleId}
                className={`toolbar-drawer-title ${pt?.drawerTitle?.className ?? ''}`}
                data-cratis-part='toolbar-folder-title'
            >
                {resolvedHeading}
            </span>
            <button
                {...pt?.drawerClose}
                type='button'
                aria-label={resolvedCloseLabel}
                onClick={(event) => {
                    pt?.drawerClose?.onClick?.(event);
                    close(true);
                }}
                className={`toolbar-button toolbar-drawer-close ${pt?.drawerClose?.className ?? ''}`}
                data-cratis-part='toolbar-folder-close'
            >
                {resolvedCloseIcon}
            </button>
        </div>
    );
};

const renderDrawerTiles = (view: ToolbarFolderView) => {
    const { catalogueItems, pt, handleTileActivate, onItemDragStart, handleTileDragEnd, draggable } = view;
    return catalogueItems.map((item) => (
        <ToolbarDrawerTile
            key={item.id}
            title={item.title}
            icon={item.icon}
            disabled={item.disabled}
            disabledReason={item.disabledReason}
            draggable={draggable}
            data={item.payload}
            onClick={() => handleTileActivate(item)}
            onDragStart={(_, event) => onItemDragStart?.(item, event)}
            onDragEnd={(_, event) => handleTileDragEnd(item, event)}
            itemId={item.id}
            root={pt?.tile}
            iconPart={pt?.tileIcon}
            label={pt?.tileLabel}
        />
    ));
};

const renderPanelContents = (view: ToolbarFolderView) => view.isDrawer ? (
    <ToolbarDrawerContext.Provider value={view.drawerContext}>
        {renderDrawerHeader(view)}
        <div className='toolbar-drawer-tiles'>
            {renderDrawerTiles(view)}
            {view.items}
        </div>
    </ToolbarDrawerContext.Provider>
) : view.items;

const panelStyle = (view: ToolbarFolderView, drawerStyle: CSSProperties) => ({
    ...view.pt?.panel?.style,
    ...(view.mode === 'grid' && !view.isDrawer
        ? {
              gridTemplateColumns: `repeat(${view.columns}, minmax(2.5rem, 2.5rem))`,
          }
        : {}),
    ...drawerStyle,
});

/** Renders the existing panel and providers without adding a component boundary. */
export const renderToolbarFolderPanel = (view: ToolbarFolderView, drawerStyle: CSSProperties) => {
    const { pt, panelRef, panelId, title, titleId, isExpanded, mode, isDrawer, isDragging, placement, folderDirection, isToolbarItemVisible } = view;
    const panelVisibleClass = isExpanded ? 'toolbar-folder-panel--visible' : '';
    const directionClass = `toolbar-folder-panel--${folderDirection}`;
    const modeClass = mode === 'list' ? 'toolbar-folder-panel--list' : '';
    const drawerClass = isDrawer ? 'toolbar-folder-panel--drawer' : '';
    return (
        <div
            {...pt?.panel}
            ref={panelRef}
            id={panelId}
            role='group'
            aria-label={isDrawer ? undefined : title}
            aria-labelledby={isDrawer ? titleId : undefined}
            className={`toolbar-folder-panel ${directionClass} ${panelVisibleClass} ${modeClass} ${drawerClass} ${pt?.panel?.className ?? ''}`}
            style={panelStyle(view, drawerStyle)}
            data-cratis-part='toolbar-folder-panel'
            data-expanded={isExpanded || undefined}
            data-open={isExpanded || undefined}
            data-direction={folderDirection}
            data-mode={mode}
            data-presentation={isDrawer ? 'drawer' : undefined}
            data-side={isDrawer ? placement?.side ?? folderDirection : undefined}
            data-dragging={isDrawer && isDragging ? '' : undefined}
            aria-hidden={!isExpanded}
            inert={!isExpanded}
        >
            <ToolbarItemVisibilityProvider value={isExpanded && isToolbarItemVisible}>
                {renderPanelContents(view)}
            </ToolbarItemVisibilityProvider>
        </div>
    );
};
