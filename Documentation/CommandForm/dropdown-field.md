# DropdownField

`DropdownField` renders a PrimeReact `Dropdown` for selecting a single value from a list of options.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { DropdownField } from '@cratis/components/CommandForm';

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
];

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <DropdownField<MyCommand>
        value={c => c.status}
        options={statusOptions}
        optionLabel="label"
        optionValue="value"
        placeholder="Select a status"
    />
</CommandDialog>
```

With custom data:

```tsx
const roles = [
    { id: 'admin', display: 'Administrator' },
    { id: 'user', display: 'Standard User' },
];

<DropdownField<MyCommand>
    value={c => c.role}
    options={roles}
    optionLabel="display"
    optionValue="id"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `options` | `Array<{ [key: string]: unknown }>` | — | **Required.** Array of option objects. |
| `optionLabel` | `string` | — | **Required.** Key in each option object to use as the display label. |
| `optionValue` | `string` | — | **Required.** Key in each option object to use as the submitted value. |
| `placeholder` | `string` | — | Placeholder text shown when no value is selected. |

## Behavior

- Default value is an empty string.
- The field spans full width within its container.
- Validation state is reflected via the PrimeReact `invalid` flag.

