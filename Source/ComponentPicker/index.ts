// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export * from './ComponentHighlight';
export * from './ComponentPicker';
export * from './ComponentResolver';
export * from './PickedAncestor';
export * from './PickedComponent';
export * from './PickedPresentationProperty';
export * from './PickedRect';
export * from './PresentationPropertyEditor';
export * from './describeComponentElement';
export * from './proposedChanges';
export * from './useComponentPicker';
export { describeComponent } from '../configuration/identity/describeComponent';
export {
    knownComponentDescriptors,
    previewPresentationChanges,
    registeredComponentFor,
} from '../configuration/identity/componentInstances';
export {
    componentAttribute,
    componentIdAttribute,
    componentInstanceAttribute,
} from '../configuration/identity/componentIdentityAttributes';
export type { ComponentDescriptor } from '../configuration/identity/ComponentDescriptor';
export type { PresentationChange } from '../configuration/identity/PresentationChange';
export type { PresentationPropertyDescriptor } from '../configuration/identity/PresentationPropertyDescriptor';
export type { PresentationPropertyType } from '../configuration/identity/PresentationPropertyType';
export type { PresentationPropertyValue } from '../configuration/identity/PresentationPropertyValue';
export type { RegisteredComponent } from '../configuration/identity/RegisteredComponent';
export { useComponentPresentation } from '../configuration/identity/useComponentPresentation';
export { componentMarker } from '../configuration/identity/componentMarker';
export type { ComponentMarkerAttributes } from '../configuration/identity/ComponentMarkerAttributes';
