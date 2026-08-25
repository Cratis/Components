// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export { Canvas, CanvasItemRegistryContext } from './Canvas';
export type {
    CanvasCaptureAttributes,
    CanvasContext,
    CanvasHandle,
    CanvasItemData,
    CanvasItemRegistryContextValue,
    CanvasItemRegistryEntry,
    CanvasProps,
} from './Canvas';
export { CanvasItem } from './CanvasItem';
export type { CanvasItemProps } from './CanvasItem';
export { CanvasMinimap } from './CanvasMinimap';
export type {
    MinimapItem,
    CanvasMinimapHandle,
    CanvasMinimapProps,
} from './CanvasMinimap';
export { CanvasControls } from './CanvasControls';
export type { CanvasControlsProps, CanvasControlsLabels } from './CanvasControls';
export { CanvasOverlay } from './CanvasOverlay';
export type { CanvasOverlayProps } from './CanvasOverlay';
export { canvasGesture } from './canvasGesture';
export { canvasTransformActivity } from './canvasTransformActivity';
export { createSelfSuspendingFrameLoop } from './selfSuspendingFrameLoop';
export type { SelfSuspendingFrameLoop } from './selfSuspendingFrameLoop';

export * from './shapes/Note';
export * from './shapes/Region';
export * from './shapes/ChatBubble';
