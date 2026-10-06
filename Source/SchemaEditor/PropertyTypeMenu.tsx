// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo, type ButtonHTMLAttributes, type Key, type ReactNode } from 'react';
import { UNSAFE_PortalProvider } from 'react-aria';
import { Button as AriaButton } from 'react-aria-components/Button';
import { Header, Menu, MenuItem, MenuSection, MenuTrigger, Popover, Separator } from 'react-aria-components/Menu';
import { asReactAriaButtonProps } from '../Common/reactAriaProps';
import { OVERLAY_OFFSET, zIndexAboveDialog } from '../renderer/dialogStack';
import { useNearestDialogZIndex } from '../renderer/DialogStackContext';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import type { PropertyConcept } from './PropertyConcept';
import type { PropertyType } from './PropertyType';
import type { SchemaEditorLabels } from './SchemaEditorLabels';
import type { SchemaEditorParts } from './SchemaEditorParts';
import { compositePropertyTypes, primitivePropertyTypes, propertyTypeGlyph, propertyTypeName } from './propertyTypeDisplay';

const typePrefix = 'type:';
const conceptPrefix = 'concept:';

/** Props for the menu of types the editor offers when adding a property or changing its type. */
export interface PropertyTypeMenuProps {
    /** The resolved labels. */
    labels: Required<SchemaEditorLabels>;

    /** The concepts offered after the primitive types. `undefined` when the host has not opted into concepts; an empty list shows a disabled hint. */
    concepts: PropertyConcept[] | undefined;

    /** The part of the editor the trigger button is: the add button or the row's type button. */
    triggerPart: 'add' | 'typeButton';

    /** The accessible name of the trigger. */
    triggerLabel: string;

    /** The content of the trigger. */
    children: ReactNode;

    /** The parts the host styles. */
    parts: SchemaEditorParts | undefined;

    /** Called with the chosen type, and the concept's name when a concept was chosen. */
    onSelect: (type: PropertyType, concept?: string) => void;
}

/**
 * The accessible menu of types: the primitives, the concepts of the domain, then the composite types. It is a
 * React Aria menu in a popover, so it handles keyboard navigation, typeahead, focus return and dismissal.
 */
export const PropertyTypeMenu = ({ labels, concepts, triggerPart, triggerLabel, children, parts, onSelect }: PropertyTypeMenuProps) => {
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const nearestDialogZIndex = useNearestDialogZIndex();
    const zIndex = nearestDialogZIndex === null
        ? 'var(--cratis-z-index-overlay)'
        : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);

    const sortedConcepts = useMemo(
        () => [...(concepts ?? [])].sort((left, right) => left.name.localeCompare(right.name)),
        [concepts]);

    const handleAction = (key: Key) => {
        const identifier = String(key);
        if (identifier.startsWith(conceptPrefix)) {
            const concept = sortedConcepts.find(candidate => candidate.name === identifier.slice(conceptPrefix.length));
            if (concept) onSelect(concept.type, concept.name);
            return;
        }
        onSelect(identifier.slice(typePrefix.length) as PropertyType);
    };

    const typeItem = (type: PropertyType) => (
        <MenuItem
            key={type}
            id={`${typePrefix}${type}`}
            textValue={propertyTypeName(type, labels)}
            className={`cratis-schema-editor__menu-item ${parts?.menuItem?.className ?? ''}`}
            data-cratis-part='menuItem'
        >
            <span className='cratis-schema-editor__badge-glyph' aria-hidden='true'>{propertyTypeGlyph[type]}</span>
            {propertyTypeName(type, labels)}
        </MenuItem>
    );

    const triggerAttributes: ButtonHTMLAttributes<HTMLButtonElement> | undefined = parts?.[triggerPart];

    return (
        <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
            <MenuTrigger>
                <AriaButton
                    {...asReactAriaButtonProps(triggerAttributes)}
                    aria-label={triggerLabel}
                    className={`cratis-schema-editor__${triggerPart === 'add' ? 'add' : 'type-button'} ${triggerAttributes?.className ?? ''}`}
                    data-cratis-part={triggerPart === 'add' ? 'add' : 'typeButton'}
                >
                    {children}
                </AriaButton>
                <Popover
                    {...parts?.menu}
                    className={`cratis-schema-editor__menu ${parts?.menu?.className ?? ''}`}
                    style={{ zIndex, ...parts?.menu?.style } as React.CSSProperties}
                    data-cratis-part='menu'
                >
                    <Menu aria-label={labels.propertyTypes} onAction={handleAction} className='cratis-schema-editor__menu-list'>
                        {primitivePropertyTypes.map(typeItem)}
                        {concepts !== undefined && (
                            <MenuSection className='cratis-schema-editor__menu-section'>
                                <Header className='cratis-schema-editor__menu-heading'>{labels.concepts}</Header>
                                {sortedConcepts.length === 0 && (
                                    <MenuItem
                                        id='concept-hint'
                                        isDisabled
                                        textValue={labels.noConcepts}
                                        className={`cratis-schema-editor__menu-item cratis-schema-editor__menu-hint ${parts?.menuItem?.className ?? ''}`}
                                        data-cratis-part='menuItem'
                                    >
                                        {labels.noConcepts}
                                    </MenuItem>
                                )}
                                {sortedConcepts.map(concept => (
                                    <MenuItem
                                        key={concept.name}
                                        id={`${conceptPrefix}${concept.name}`}
                                        textValue={concept.name}
                                        className={`cratis-schema-editor__menu-item ${parts?.menuItem?.className ?? ''}`}
                                        data-cratis-part='menuItem'
                                    >
                                        <span className='cratis-schema-editor__badge-glyph' aria-hidden='true'>{propertyTypeGlyph[concept.type]}</span>
                                        {concept.name}
                                    </MenuItem>
                                ))}
                            </MenuSection>
                        )}
                        <Separator className='cratis-schema-editor__menu-separator' />
                        {compositePropertyTypes.map(typeItem)}
                    </Menu>
                </Popover>
            </MenuTrigger>
        </UNSAFE_PortalProvider>
    );
};
