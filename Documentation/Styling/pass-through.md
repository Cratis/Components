# Pass-through (`pt`) cheat sheet

Every Cratis wrapper forwards PrimeReact's `pt`, `ptOptions`, and `unstyled` props somewhere — but **where** depends on how much PrimeReact the wrapper composes. This page summarizes the pattern per component so you know which prop to reach for.

## Three patterns

### 1. Single-widget wrappers

The wrapper renders exactly one PrimeReact widget and forwards `pt` / `ptOptions` / `unstyled` / `className` straight to it. The pt slot names are PrimeReact's own — see the underlying component's documentation.

| Wrapper | Underlying widget | pt slot reference |
|---|---|---|
| `Dialog`            | `primereact/dialog` Dialog          | PrimeReact Dialog `pt` |
| `Dropdown`          | `primereact/dropdown` Dropdown      | PrimeReact Dropdown `pt` |
| `InputTextField`    | `primereact/inputtext` InputText    | PrimeReact InputText `pt` |
| `TextAreaField`     | `primereact/inputtextarea` InputTextarea | PrimeReact InputTextarea `pt` |
| `NumberField`       | `primereact/inputnumber` InputNumber | PrimeReact InputNumber `pt` |
| `DropdownField`     | `primereact/dropdown` Dropdown      | PrimeReact Dropdown `pt` |
| `RadioGroupField`   | `primereact/radiobutton` RadioButton (one per option) | PrimeReact RadioButton `pt` |
| `RadioButtonField`  | `primereact/radiobutton` RadioButton | PrimeReact RadioButton `pt` |
| `CalendarField`     | `primereact/calendar` Calendar      | PrimeReact Calendar `pt` |
| `CheckboxField`     | `primereact/checkbox` Checkbox      | PrimeReact Checkbox `pt` |
| `SliderField`       | `primereact/slider` Slider          | PrimeReact Slider `pt` |
| `ChipsField`        | `primereact/chips` Chips            | PrimeReact Chips `pt` |
| `MultiSelectField`  | `primereact/multiselect` MultiSelect | PrimeReact MultiSelect `pt` |
| `ColorPickerField`  | `primereact/colorpicker` ColorPicker | PrimeReact ColorPicker `pt` |

Example:

```tsx
<InputTextField
    value={c => c.email}
    title="Email"
    pt={{ root: { className: 'border-2 border-sky-500' } }}
/>
```

### 2. Multi-slot composites

The wrapper composes more than one PrimeReact widget and exposes a sibling set of `*Pt` / `*PtOptions` / `*Unstyled` / `*ClassName` props per slot.

#### `Dialog`-based dialogs

`CommandDialog` is a single Dialog and forwards `pt`/`ptOptions`/`unstyled` to that Dialog.

`StepperCommandDialog` composes a Dialog **and** a Stepper:

| Prop | Targets |
|---|---|
| `pt` / `ptOptions` / `unstyled` | The inner PrimeReact Stepper. |
| `dialogPt` / `dialogPtOptions` / `dialogUnstyled` / `dialogClassName` | The outer PrimeReact Dialog. |

```tsx
<StepperCommandDialog<RegisterAuthor>
    command={RegisterAuthor}
    title="Register author"
    pt={{ stepperpanel: { content: { className: 'pt-6' } } }}
    dialogPt={{ header: { className: 'bg-slate-900 text-slate-50' } }}
    dialogClassName="shadow-2xl"
>
    …
</StepperCommandDialog>
```

#### Data tables and pages

`DataTableForQuery` and `DataTableForObservableQuery` each compose a DataTable **and** a Paginator:

| Prop | Targets |
|---|---|
| `pt` / `ptOptions` / `unstyled` / `className` | The inner DataTable. |
| `paginatorPt` / `paginatorPtOptions` / `paginatorUnstyled` | The inner Paginator. |

`DataPage` composes a DataTable **and** a Menubar:

| Prop | Targets |
|---|---|
| `tablePt` / `tablePtOptions` / `tableUnstyled` / `tableClassName` | The inner DataTable. |
| `menubarPt` / `menubarPtOptions` / `menubarUnstyled` / `menubarClassName` | The action Menubar. |

```tsx
<DataPage<AllAuthors, Author, never>
    title="Authors"
    query={AllAuthors}
    tablePt={{ table: { className: 'min-w-full divide-y divide-slate-700' } }}
    menubarPt={{ root: { className: 'px-3 py-2 bg-slate-900' } }}
>
    <DataPage.MenuItems>…</DataPage.MenuItems>
    <DataPage.Columns>…</DataPage.Columns>
</DataPage>
```

### 3. Large composites

These wrappers render many PrimeReact widgets internally (`InputText`, `InputNumber`, `Checkbox`, `Calendar`, `InputTextarea`, `Dropdown`, `Button`, `Menubar`, …). Exposing a `pt` prop per inner widget would be impractical; instead, they expose **`className`** on the root for layout/positioning, and you restyle their internals via the **global `pt` preset** on [`CratisComponentsProvider`](../Common/cratis-components-provider.md).

| Wrapper | What it accepts | How to restyle internals |
|---|---|---|
| `ObjectContentEditor`   | `className` | Global `pt` on `CratisComponentsProvider` covering `inputtext`, `inputnumber`, `checkbox`, `calendar`, `inputtextarea`. |
| `ObjectNavigationalBar` | `className` | Global `pt` covering `button`; `--cratis-surface-border` for the bottom border. |
| `SchemaEditor`          | `className` | Global `pt` covering `menubar`, `button`, `datatable`, `dropdown`, `inputtext`. |

Example with a global preset:

```tsx
<CratisComponentsProvider value={{
    unstyled: true,
    pt: {
        inputtext: { root: { className: 'my-input' } },
        inputnumber: { input: { root: { className: 'my-input' } } },
        button: { root: { className: 'my-btn' } },
        /* … */
    }
}}>
    <ObjectContentEditor object={data} schema={schema} editMode />
</CratisComponentsProvider>
```

## Where the global `pt` reaches

A `pt` preset on `CratisComponentsProvider` flows into **every** PrimeReact widget rendered by every wrapper — including the internals of the large composites. Per-instance `pt` props on individual wrappers are *merged* with the global preset (PrimeReact's `ptOptions.mergeSections` defaults to `true`).

To replace a slot's preset entirely on a single instance, opt out of merging:

```tsx
<Button label="Special" pt={{ root: { className: 'special-btn' } }}
        ptOptions={{ mergeSections: false }} />
```

## Components that do NOT accept per-instance `pt`

- **`BusyIndicatorDialog`** — the dialog is rendered by the dialog host on demand and the request type lives in `@cratis/arc.react`, so no per-instance prop is plumbed through. Use the **global `pt`** on `CratisComponentsProvider` to restyle it.

## See also

- [CratisComponentsProvider](../Common/cratis-components-provider.md) — global `pt` / `unstyled` setup
- [Path C — Fully unstyled](unstyled.md) — full pt-preset walk-through
