// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import type { ConfigurationEditorPartAttributes } from './ConfigurationEditorPartAttributes';

/**
 * Stable Cratis-owned parts for styling {@link PropertyControls}. Each is marked with a matching
 * `data-cratis-part` attribute and receives what is passed here; the controls' own wiring wins.
 */
export interface PropertyControlsParts {
    /** The controls root. */
    root?: ConfigurationEditorPartAttributes<HTMLDivElement>;

    /** One group of controls. Carries `data-group`. */
    group?: ConfigurationEditorPartAttributes<HTMLElement>;

    /** A group's heading. */
    groupTitle?: ConfigurationEditorPartAttributes<HTMLHeadingElement>;

    /** A group's description. */
    groupDescription?: ConfigurationEditorPartAttributes<HTMLParagraphElement>;

    /** One property: its label, control, unit and messages. Carries `data-property`, `data-kind` and `data-readonly`. */
    property?: ConfigurationEditorPartAttributes<HTMLDivElement>;

    /** The property's visible label. A `label` element for an editable property, a `span` for a read-only one. */
    label?: ConfigurationEditorPartAttributes<HTMLElement>;

    /** The text shown for a property that cannot be edited. */
    value?: ConfigurationEditorPartAttributes<HTMLSpanElement>;

    /** The text, number and checkbox inputs. */
    input?: InputHTMLAttributes<HTMLInputElement>;

    /** The choice select. */
    select?: SelectHTMLAttributes<HTMLSelectElement>;

    /** The unit shown after a number. */
    unit?: ConfigurationEditorPartAttributes<HTMLSpanElement>;

    /** A property's description, validation message or reason it is unavailable. */
    message?: ConfigurationEditorPartAttributes<HTMLParagraphElement>;
}
