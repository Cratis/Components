# Dropdown

The `Dropdown` component is a wrapper around PrimeReact's Dropdown with automatic z-index management for proper overlay behavior.

## Purpose

Dropdown provides a select component that correctly appears above dialogs and other overlays without z-index conflicts.

## Key Features

- Full PrimeReact Dropdown functionality
- Automatic z-index management
- Works inside dialogs
- Appends to document body by default
- All PrimeReact Dropdown props supported

## Quick Start

```typescript
import { Dropdown } from '@cratis/components';

function MyForm() {
    const [selectedCity, setSelectedCity] = useState(null);
    
    const cities = [
        { label: 'Oslo', value: 'oslo' },
        { label: 'Bergen', value: 'bergen' },
        { label: 'Trondheim', value: 'trondheim' }
    ];

    return (
        <Dropdown
            value={selectedCity}
            options={cities}
            onChange={(e) => setSelectedCity(e.value)}
            placeholder="Select a City"
        />
    );
}
```

## Props

All PrimeReact Dropdown props are supported. See [PrimeReact Dropdown Documentation](https://primereact.org/dropdown/) for complete list.

### Common Props

```typescript
interface DropdownProps {
    value?: unknown;
    options: Array<{ label: string; value: unknown }>;
    onChange?: (e: { value: unknown }) => void;
    placeholder?: string;
    disabled?: boolean;
    filter?: boolean;
    filterPlaceholder?: string;
    showClear?: boolean;
    optionLabel?: string;
    optionValue?: string;
    // ... all other PrimeReact Dropdown props
}
```

## Basic Examples

### Simple String Options

```typescript
const options = ['React', 'Angular', 'Vue', 'Svelte'];

<Dropdown
    value={selectedFramework}
    options={options}
    onChange={(e) => setSelectedFramework(e.value)}
    placeholder="Select Framework"
/>
```

### Object Options

```typescript
const countries = [
    { name: 'Norway', code: 'NO' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Denmark', code: 'DK' }
];

<Dropdown
    value={selectedCountry}
    options={countries}
    onChange={(e) => setSelectedCountry(e.value)}
    optionLabel="name"
    placeholder="Select Country"
/>
```

### With Filtering

```typescript
<Dropdown
    value={selected}
    options={longListOfOptions}
    onChange={(e) => setSelected(e.value)}
    filter
    filterPlaceholder="Search..."
    placeholder="Select Option"
/>
```

### Clearable Selection

```typescript
<Dropdown
    value={selected}
    options={options}
    onChange={(e) => setSelected(e.value)}
    showClear
    placeholder="Select (optional)"
/>
```

### Grouped Options

```typescript
const groupedCities = [
    {
        label: 'Norway',
        items: [
            { label: 'Oslo', value: 'oslo' },
            { label: 'Bergen', value: 'bergen' }
        ]
    },
    {
        label: 'Sweden',
        items: [
            { label: 'Stockholm', value: 'stockholm' },
            { label: 'Gothenburg', value: 'gothenburg' }
        ]
    }
];

<Dropdown
    value={selected}
    options={groupedCities}
    onChange={(e) => setSelected(e.value)}
    optionLabel="label"
    optionGroupLabel="label"
    optionGroupChildren="items"
    placeholder="Select City"
/>
```

### Custom Item Template

```typescript
const countryTemplate = (option: Country) => {
    return (
        <div className="flex align-items-center">
            <img src={`/flags/${option.code}.png`} width="20" alt={option.name} />
            <span className="ml-2">{option.name}</span>
        </div>
    );
};

<Dropdown
    value={selectedCountry}
    options={countries}
    onChange={(e) => setSelectedCountry(e.value)}
    itemTemplate={countryTemplate}
    optionLabel="name"
    placeholder="Select Country"
/>
```

## Inside Dialogs

Dropdown automatically works correctly inside dialogs:

```typescript
<Dialog visible={visible} onHide={() => setVisible(false)}>
    <div className="field">
        <label>Category</label>
        <Dropdown
            value={category}
            options={categories}
            onChange={(e) => setCategory(e.value)}
            placeholder="Select Category"
        />
    </div>
</Dialog>
```

The dropdown panel will appear above the dialog without z-index issues.

## Z-Index Management

The component uses `useOverlayZIndex` hook to ensure proper layering:

- Dropdown panel automatically gets correct z-index
- Works with multiple layered dialogs
- Appends to document body by default
- Prevents overlay conflicts

## Disabled State

```typescript
<Dropdown
    value={selected}
    options={options}
    disabled={isLoading}
    placeholder="Loading..."
/>
```

## Validation and Errors

Integrate with form validation:

```typescript
<div className="field">
    <label htmlFor="status">Status</label>
    <Dropdown
        id="status"
        value={formData.status}
        options={statusOptions}
        onChange={(e) => setFormData({ ...formData, status: e.value })}
        className={errors.status ? 'p-invalid' : ''}
    />
    {errors.status && <small className="p-error">{errors.status}</small>}
</div>
```

## Complete Form Example

```typescript
import { Dropdown } from '@cratis/components';
import { useState } from 'react';

interface FormData {
    category: string;
    priority: string;
    assignee: string;
}

function IssueForm() {
    const [formData, setFormData] = useState<FormData>({
        category: '',
        priority: '',
        assignee: ''
    });

    const categories = [
        { label: 'Bug', value: 'bug' },
        { label: 'Feature', value: 'feature' },
        { label: 'Improvement', value: 'improvement' }
    ];

    const priorities = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
    ];

    const assignees = [
        { label: 'Alice', value: 'alice' },
        { label: 'Bob', value: 'bob' },
        { label: 'Charlie', value: 'charlie' }
    ];

    return (
        <form>
            <div className="field">
                <label htmlFor="category">Category</label>
                <Dropdown
                    id="category"
                    value={formData.category}
                    options={categories}
                    onChange={(e) => setFormData({ ...formData, category: e.value })}
                    placeholder="Select Category"
                />
            </div>

            <div className="field">
                <label htmlFor="priority">Priority</label>
                <Dropdown
                    id="priority"
                    value={formData.priority}
                    options={priorities}
                    onChange={(e) => setFormData({ ...formData, priority: e.value })}
                    placeholder="Select Priority"
                />
            </div>

            <div className="field">
                <label htmlFor="assignee">Assignee</label>
                <Dropdown
                    id="assignee"
                    value={formData.assignee}
                    options={assignees}
                    onChange={(e) => setFormData({ ...formData, assignee: e.value })}
                    placeholder="Assign to..."
                    showClear
                    filter
                />
            </div>
        </form>
    );
}
```

## Use Cases

- **Form fields**: Select inputs in forms
- **Filters**: Filtering data by category, status, etc.
- **Preferences**: User settings selection
- **Navigation**: Menu-style navigation options
- **Status selection**: Workflow state transitions
- **Type selection**: Choose item types in editors

## Differences from PrimeReact Dropdown

This component extends PrimeReact Dropdown with:

1. **Automatic z-index management**: Works correctly in dialogs without manual configuration
2. **Default appendTo**: Automatically appends to document.body
3. **Consistent behavior**: Same overlay behavior across all usage contexts

Otherwise, it's identical to PrimeReact Dropdown.

## Best Practices

1. **Provide clear labels**: Always label dropdowns
2. **Use placeholders**: Guide users with meaningful placeholders
3. **Enable filtering for long lists**: Use `filter` prop for 10+ options
4. **Show clear button**: Use `showClear` for optional selections
5. **Validate selections**: Provide error feedback
6. **Disable when appropriate**: Disable during loading or when unavailable
7. **Use object options**: For complex data with multiple properties
8. **Group related options**: Use grouped options for better organization
9. **Provide feedback**: Show loading states, error states clearly

## Accessibility

Inherits PrimeReact Dropdown accessibility features:

- Keyboard navigation (Arrow keys, Enter, Escape)
- ARIA labels and roles
- Focus management
- Screen reader support

Enhance with:

```typescript
<label htmlFor="dropdown-id">
    Selection Label
</label>
<Dropdown
    id="dropdown-id"
    aria-label="Selection Label"
    // ... other props
/>
```

## Styling

Style via className or custom CSS:

```typescript
<Dropdown
    className="w-full"
    panelClassName="custom-dropdown-panel"
    // ...
/>
```

Or global CSS:

```css
.p-dropdown {
    /* Custom dropdown styles */
}

.p-dropdown-panel {
    /* Custom panel styles */
}
```
