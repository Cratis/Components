# FormElement

Wrapper component for form inputs with label and validation display.

## Purpose

FormElement provides consistent styling and structure for form input fields with labels and validation messages.

## Key Features

- Label positioning
- Validation error display
- Required field indication
- Consistent spacing
- Integration with form validation

## Basic Usage

```typescript
import { FormElement } from '@cratis/components';
import { InputText } from 'primereact/inputtext';

function MyForm() {
    return (
        <FormElement label="Name" required={true} error="Name is required">
            <InputText value={name} onChange={(e) => setName(e.target.value)} />
        </FormElement>
    );
}
```

## Props

- `label`: Label text for the field
- `required`: Show required indicator (default: false)
- `error`: Validation error message to display
- `children`: The form input component

## Examples

### Text Input

```typescript
<FormElement label="Email" required>
    <InputText 
        type="email"
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
    />
</FormElement>
```

### With Validation Error

```typescript
<FormElement 
    label="Password" 
    required 
    error={passwordError}
>
    <InputText 
        type="password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
    />
</FormElement>
```

### Dropdown

```typescript
<FormElement label="Country" required>
    <Dropdown 
        value={country}
        options={countries}
        onChange={(e) => setCountry(e.value)}
    />
</FormElement>
```

### Checkbox

```typescript
<FormElement label="Agree to Terms">
    <Checkbox 
        checked={agreed}
        onChange={(e) => setAgreed(e.checked)}
    />
</FormElement>
```

### Text Area

```typescript
<FormElement label="Description">
    <InputTextarea 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
    />
</FormElement>
```

## Complete Form Example

```typescript
function UserForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: null
    });
    const [errors, setErrors] = useState({});

    return (
        <form onSubmit={handleSubmit}>
            <FormElement 
                label="Full Name" 
                required 
                error={errors.name}
            >
                <InputText 
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                />
            </FormElement>

            <FormElement 
                label="Email Address" 
                required 
                error={errors.email}
            >
                <InputText 
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                />
            </FormElement>

            <FormElement 
                label="Role" 
                required 
                error={errors.role}
            >
                <Dropdown 
                    value={formData.role}
                    options={roleOptions}
                    onChange={(e) => handleChange('role', e.value)}
                />
            </FormElement>

            <Button type="submit" label="Save" />
        </form>
    );
}
```

## Best Practices

1. Always use FormElement for consistent form layouts
2. Show required indicators on mandatory fields
3. Display validation errors clearly
4. Keep labels concise
5. Group related fields together
6. Use appropriate input types for data
