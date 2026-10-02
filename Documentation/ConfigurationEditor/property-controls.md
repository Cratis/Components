---
title: Property controls
description: Generic text, number, on/off and choice controls described by the host, for layout settings or a component's own configuration.
---

`PropertyControls` renders controls from descriptors the host supplies. There is no layout engine, no component registry and no built-in list of properties: a gap, an alignment, a grid span or a responsive override is just a descriptor.

```tsx
import { useState } from 'react';
import { PropertyControls } from '@cratis/components/ConfigurationEditor';
import type { PropertyGroup } from '@cratis/components/ConfigurationEditor';

const flow: PropertyGroup = {
    id: 'flow',
    title: 'Flow',
    properties: [
        { kind: 'number', name: 'gap', label: 'Gap', min: 0, max: 64, step: 4, unit: 'px' },
        {
            kind: 'choice',
            name: 'align',
            label: 'Alignment',
            options: [
                { value: 'start', label: 'Start' },
                { value: 'center', label: 'Center' },
            ],
        },
        { kind: 'boolean', name: 'grow', label: 'Grow to fill the space' },
    ],
};

export function FlowSettings() {
    const [values, setValues] = useState<Record<string, unknown>>({ gap: 8 });

    return (
        <PropertyControls
            aria-label='Layout settings'
            groups={[flow]}
            values={values}
            onChange={(proposal) => setValues({ ...proposal.values })}
        />
    );
}
```

## Descriptors

| `kind` | Control | Specific properties |
|---|---|---|
| `'text'` | Text input | `placeholder` |
| `'number'` | Number input | `min`, `max`, `step`, `unit`, `required` |
| `'boolean'` | Checkbox | |
| `'choice'` | Select | `options` as `{ value, label }` |

Every descriptor has a `name` (the key in `values`), a `label`, and optionally `description`, `editable` and `unavailableReason`. Descriptors come in titled `groups`. Use groups for the settings of an ordered flow, a grid placement, a freeform placement, or the overrides for a compact screen: a host that supports another layout type supplies one more group, and nothing inside the controls changes.

## Proposals and validation

`onChange` receives `{ name, value, previous, values }`, where `values` is the object after the change. Apply it by passing new `values`, or ignore it to cancel.

A number is validated against `min`, `max` and `required` before it is proposed; text that is not a number, a value out of range, or an empty required field produces a message and no proposal. An empty optional number clears the property (`value` is `undefined`). Add rules with `validate(name, value, values)`, and pass feedback from elsewhere in `messages`. While a message shows, the typed text stays in the field; leaving the field restores the current value.

## Properties that cannot change

Set `editable: false` on a descriptor, or `readOnly` on the controls, and the value is shown as text. A change to it is never proposed. Give `unavailableReason` so the person is told why, for example that a template fixes the value.

## Localization and styling

`labels` replaces the controls' own messages. `pt` passes attributes to the stable parts: `root`, `group`, `groupTitle`, `groupDescription`, `property`, `label`, `value`, `input`, `select`, `unit` and `message`. A property carries `data-property`, `data-kind` and, when it cannot change, `data-readonly`. In a narrow container each label stacks above its control.
