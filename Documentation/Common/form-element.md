# FormElement

Lightweight wrapper that places an icon addon to the left of a form input, styled with the `--cratis-*` token layer. Use it to give input fields a leading icon without pulling in PrimeReact's `InputGroup` chrome.

## Purpose

FormElement is a structural primitive — it lays out an icon addon and a child input side by side, with rounded-on-the-left chrome around the addon. It does **not** render labels, required indicators, or validation messages — those concerns live on the underlying input itself or on the surrounding command form.

## Key Features

- Icon addon styled from `--cratis-*` tokens (background, border, radius).
- Independent of PrimeReact's `p-inputgroup` / `p-inputgroup-addon` classes — works the same with or without a PrimeReact theme loaded.
- Accepts any React node as the icon (PrimeIcons class, `<svg>`, third-party icon component, …).

## Props

| Prop | Type | Description |
|---|---|---|
| `icon` | `React.ReactNode` | Icon node displayed inside the leading addon. Can be any React node — a PrimeIcons `<i className="pi pi-…" />`, an `<svg>`, or a `react-icons` component. |
| `children` | `React.ReactNode` | The form input rendered to the right of the icon addon (typically an `InputText`, `Dropdown`, etc.). |

## Basic Usage

```tsx
import { FormElement } from '@cratis/components';
import { InputText } from 'primereact/inputtext';

function MyForm() {
    return (
        <FormElement icon={<i className="pi pi-user" />}>
            <InputText value={name} onChange={(e) => setName(e.target.value)} />
        </FormElement>
    );
}
```

## Examples

### Email field with envelope icon

```tsx
<FormElement icon={<i className="pi pi-envelope" />}>
    <InputText
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
    />
</FormElement>
```

### Search field with react-icons

```tsx
import { FaMagnifyingGlass } from 'react-icons/fa6';

<FormElement icon={<FaMagnifyingGlass />}>
    <InputText
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
    />
</FormElement>
```

### Dropdown with category icon

```tsx
import { FaLayerGroup } from 'react-icons/fa6';

<FormElement icon={<FaLayerGroup />}>
    <Dropdown
        value={category}
        options={categories}
        onChange={(e) => setCategory(e.value)}
        optionLabel="name"
        optionValue="id"
    />
</FormElement>
```

## Styling

The addon's background, border, and radius are driven by the [`--cratis-*` token layer](../Styling/cratis-tokens.md):

| Token | Surface |
|---|---|
| `--cratis-surface-100` | Addon background. |
| `--cratis-surface-border` | Addon border. |
| `--cratis-text-color-secondary` | Icon color. |
| `--cratis-border-radius` | Rounded-on-the-left corner radius. |

Override the tokens to retint the addon without forking the component:

```css
:root {
    --cratis-surface-100:   #1e293b;
    --cratis-surface-border: #334155;
    --cratis-border-radius:  10px;
}
```

For per-instance restyling, wrap the FormElement with your own class and target it in CSS:

```css
.brand-form-element .cratis-form-element__addon {
    background: var(--brand-accent);
    color: var(--brand-on-accent);
}
```

```tsx
<div className="brand-form-element">
    <FormElement icon={<i className="pi pi-shield" />}>
        <InputText … />
    </FormElement>
</div>
```

For full styling control under `unstyled` mode (Path C), the addon classes are stable: `cratis-form-element` on the row and `cratis-form-element__addon` on the leading slot.

## When to use FormElement vs CommandForm fields

- Use **`FormElement`** for ad-hoc forms outside of a `CommandForm`, when you want the icon-addon visual on top of any input you control.
- Use **CommandForm fields** (`InputTextField`, `NumberField`, `DropdownField`, …) inside a `CommandForm` or `CommandDialog` — they bind to a command property, surface validation state, and render the appropriate input type.

## See Also

- [Styling Overview](../Styling/index.md) — three styling paths and where FormElement fits
- [Cratis token reference](../Styling/cratis-tokens.md) — every token and the surfaces it tints
- [CommandForm Field Types](../CommandForm/index.md) — command-bound field wrappers
