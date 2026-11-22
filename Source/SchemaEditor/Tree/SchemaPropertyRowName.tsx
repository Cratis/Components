// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SchemaPropertyRowView } from './useSchemaPropertyRow';

const renderNameEditor = (view: SchemaPropertyRowView) => {
    const { context: { labels, parts }, property, nameInput, draftName, problem, messageId, setDraftName, setProblem, commit, stopEditing, handleEditKeyDown } = view;
    return (
        <span className='cratis-schema-editor__name-edit'>
            <input
                {...parts?.nameInput}
                ref={nameInput}
                type='text'
                value={draftName}
                aria-label={labels.propertyNameFor(property.name)}
                aria-invalid={problem !== undefined || undefined}
                aria-describedby={problem ? messageId : undefined}
                className={`cratis-schema-editor__name-input ${parts?.nameInput?.className ?? ''}`}
                data-cratis-part='nameInput'
                data-invalid={problem !== undefined || undefined}
                onChange={event => { setDraftName(event.target.value); setProblem(undefined); }}
                onBlur={() => { if (!commit()) stopEditing(); }}
                onKeyDown={handleEditKeyDown}
            />
            {problem && (
                <p
                    {...parts?.message}
                    id={messageId}
                    role='alert'
                    className={`cratis-schema-editor__message ${parts?.message?.className ?? ''}`}
                    data-cratis-part='message'
                >
                    {problem}
                </p>
            )}
        </span>
    );
};

/** Renders the name as a draft, an actionable name, or static text. */
export const renderSchemaPropertyName = (view: SchemaPropertyRowView) => {
    const { context: { parts, labels }, property, isEditing, canRename, isSelectable, startEditing } = view;
    if (isEditing) return renderNameEditor(view);
    if (canRename || isSelectable) {
        return (
            <button
                {...parts?.name}
                type='button'
                title={canRename ? labels.renameHint : undefined}
                aria-keyshortcuts={canRename ? 'F2' : undefined}
                className={`cratis-schema-editor__name ${parts?.name?.className ?? ''}`}
                data-cratis-part='name'
                onDoubleClick={startEditing}
                onKeyDown={event => { if (event.key === 'F2') { event.preventDefault(); startEditing(); } }}
            >
                {property.name}
            </button>
        );
    }
    return (
        <span className={`cratis-schema-editor__name cratis-schema-editor__name--static ${parts?.name?.className ?? ''}`} data-cratis-part='name'>
            {property.name}
        </span>
    );
};
