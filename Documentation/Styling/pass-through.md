# Pass-through (`pt`) cheat sheet

Every Cratis wrapper forwards PrimeReact's `pt`, `ptOptions`, and `unstyled` props somewhere — but **where** depends on how much PrimeReact the wrapper composes. This page summarizes the pattern per component so you know which prop to reach for.

## Three patterns

### 1. Single-widget wrappers

The wrapper renders exactly one PrimeReact widget and forwards `pt` / `ptOptions` / `unstyled` / `className` straight to it. The pt slot names are PrimeReact's own — see the underlying component's documentation.

| Wrapper            | Underlying widget (PrimeReact 11)                     | pt slot reference           |
| ------------------ | ----------------------------------------------------- | --------------------------- |
| `Dialog`           | `primereact/dialog` Dialog                            | PrimeReact Dialog `pt`      |
| `Dropdown`         | `primereact/select` Select                            | PrimeReact Select `pt`      |
| `InputTextField`   | `primereact/inputtext` InputText                      | PrimeReact InputText `pt`   |
| `TextAreaField`    | `primereact/textarea` Textarea                        | PrimeReact Textarea `pt`    |
| `NumberField`      | `primereact/inputnumber` InputNumber                  | PrimeReact InputNumber `pt` |
| `DropdownField`    | `primereact/select` Select                            | PrimeReact Select `pt`      |
| `RadioGroupField`  | `primereact/radiobutton` RadioButton (one per option) | PrimeReact RadioButton `pt` |
| `RadioButtonField` | `primereact/radiobutton` RadioButton                  | PrimeReact RadioButton `pt` |
| `CalendarField`    | `primereact/datepicker` DatePicker                    | PrimeReact DatePicker `pt`  |
| `CheckboxField`    | `primereact/checkbox` Checkbox                        | PrimeReact Checkbox `pt`    |
| `SliderField`      | `primereact/slider` Slider                            | PrimeReact Slider `pt`      |
| `ChipsField`       | `primereact/inputtags` InputTags                      | PrimeReact InputTags `pt`   |
| `MultiSelectField` | `primereact/select` Select (multiple mode)            | PrimeReact Select `pt`      |
| `ColorPickerField` | `primereact/inputcolor` InputColor                    | PrimeReact InputColor `pt`  |
| `EventsView`       | `primereact/timeline` Timeline                        | PrimeReact Timeline `pt`    |

`DatePickerInput` deliberately narrows PrimeReact 11's stale root pass-through declaration. Use `input` to target the rendered `data-part="input"` element; `pcInputText` is not a valid `DatePickerInput` slot because PrimeReact does not emit it at runtime.

```tsx
<DatePickerInput
    value={selectedDate}
    onChange={setSelectedDate}
    pt={{
        input: {
            id: 'appointment-date',
            'aria-label': 'Appointment date',
            'aria-describedby': 'appointment-date-help',
            disabled: true,
        },
    }}
/>
```

Example:

```tsx
<InputTextField
    value={(c) => c.email}
    title='Email'
    pt={{ root: { className: 'border-2 border-sky-500' } }}
/>
```

### 2. Multi-slot composites

The wrapper composes more than one PrimeReact widget and exposes a sibling set of `*Pt` / `*PtOptions` / `*Unstyled` / `*ClassName` props per slot.

#### `Dialog`-based dialogs

`CommandDialog` is a single Dialog and forwards `pt`/`ptOptions`/`unstyled` to that Dialog.

`StepperCommandDialog` composes a Dialog **and** a Stepper:

| Prop                                                                  | Targets                       |
| --------------------------------------------------------------------- | ----------------------------- |
| `pt` / `ptOptions` / `unstyled`                                       | The inner PrimeReact Stepper. |
| `dialogPt` / `dialogPtOptions` / `dialogUnstyled` / `dialogClassName` | The outer PrimeReact Dialog.  |

```tsx
<StepperCommandDialog<RegisterAuthor>
    command={RegisterAuthor}
    title='Register author'
    pt={{ stepperpanel: { content: { className: 'pt-6' } } }}
    dialogPt={{ header: { className: 'bg-slate-900 text-slate-50' } }}
    dialogClassName='shadow-2xl'
>
    …
</StepperCommandDialog>
```

#### Data tables and pages

`DataTableForQuery` and `DataTableForObservableQuery` each compose a DataTable **and** a Paginator:

| Prop                                          | Targets                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `pt` / `ptOptions` / `unstyled` / `className` | The inner DataTable.                                                      |
| `paginatorClassName` / `paginatorAriaLabels`  | The paginator (a Cratis button control — styled by class name, not `pt`). |

`DataPage` composes a DataTable **and** an action toolbar:

| Prop                                                                      | Targets                                                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `tablePt` / `tablePtOptions` / `tableUnstyled` / `tableClassName`         | The inner DataTable.                                                                         |
| `menubarPt` / `menubarPtOptions` / `menubarUnstyled` / `menubarClassName` | The action toolbar's buttons (PrimeReact 11 replaced the v10 Menubar with a button toolbar). |

```tsx
<DataPage<AllAuthors, Author, never>
    title='Authors'
    query={AllAuthors}
    tablePt={{ table: { className: 'min-w-full divide-y divide-slate-700' } }}
    menubarPt={{ root: { className: 'px-3 py-2 bg-slate-900' } }}
>
    <DataPage.MenuItems>…</DataPage.MenuItems>
    <DataPage.Columns>…</DataPage.Columns>
</DataPage>
```

### 3. Large composites

These wrappers render many PrimeReact widgets internally (`InputText`, `InputNumber`, `Checkbox`, `DatePicker`, `Textarea`, `Select`, `Button`, …). Exposing a `pt` prop per inner widget would be impractical; instead, they expose **`className`** on the root for layout/positioning, and you restyle their internals via the **global `pt` preset** on [`CratisComponentsProvider`](../Common/cratis-components-provider.md).

| Wrapper                 | What it accepts | How to restyle internals                                                                               |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `ObjectContentEditor`   | `className`     | Global `pt` on `CratisComponentsProvider` covering `inputtext`, `inputnumber`, `checkbox`, `textarea`. |
| `ObjectNavigationalBar` | `className`     | Global `pt` covering `button`; `--cratis-surface-border` for the bottom border.                        |
| `SchemaEditor`          | `className`     | Global `pt` covering `button`, `inputtext`, `select`, `datatable`.                                     |

Example with a global preset:

```tsx
<CratisComponentsProvider
    value={{
        unstyled: true,
        pt: {
            inputtext: { root: { className: 'my-input' } },
            inputnumber: { input: { root: { className: 'my-input' } } },
            button: { root: { className: 'my-btn' } },
            /* … */
        },
    }}
>
    <ObjectContentEditor object={data} schema={schema} editMode />
</CratisComponentsProvider>
```

## Where the global `pt` reaches

A `pt` preset on `CratisComponentsProvider` flows into **every** PrimeReact widget rendered by every wrapper — including the internals of the large composites. Per-instance `pt` props on individual wrappers are _merged_ with the global preset (PrimeReact's `ptOptions.mergeSections` defaults to `true`).

To replace a slot's preset entirely on a single instance, opt out of merging:

```tsx
<Button pt={{ root: { className: 'special-btn' } }} ptOptions={{ mergeSections: false }}>
    Special
</Button>
```

## Components that do NOT accept per-instance `pt`

- **`BusyIndicatorDialog`** — the dialog is rendered by the dialog host on demand and the request type lives in `@cratis/arc.react`, so no per-instance prop is plumbed through. Use the **global `pt`** on `CratisComponentsProvider` to restyle it.

## Versioned compatibility contract

Components 3 publishes its PrimeReact 11 compatibility surface from `@cratis/components/compatibility`. The contract is scoped to this Components major; it does not preserve PrimeReact 10 names or guarantee the same names in a future Components major.

| Contract component | Global `pt` key     | Contracted slots                                                                                                                  |
| ------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `button`           | `button`            | `root`                                                                                                                            |
| `inputtext`        | `inputtext`         | `root`                                                                                                                            |
| `textarea`         | `textarea`          | `root`                                                                                                                            |
| `inputnumber`      | `inputnumber.root`  | `root`, `input`                                                                                                                   |
| `select`           | `select.root`       | `root`, `trigger`, `value`, `clear`, `indicator`, `positioner`, `popup`, `filter`, `list`, `option`                               |
| `checkbox`         | `checkbox.root`     | `root`, `input`, `box`, `indicator`                                                                                               |
| `radiobutton`      | `radiobutton.root`  | `root`, `input`, `box`, `indicator`                                                                                               |
| `datepicker`       | `datepicker.root`   | `root`, `trigger`, `positioner`, `popup`, `calendar`, `header`, `prev`, `title`, `selectMonth`, `selectYear`, `next`, `tableBody` |
| `slider`           | `slider.root`       | `root`, `track`, `range`, `handle`                                                                                                |
| `inputtags`        | `inputtags.root`    | `root`                                                                                                                            |
| `inputcolor`       | `inputcolor.root`   | `area`, `areaBackground`, `areaHandle`, `sliderTrack`, `sliderHandle`, `swatch`, `swatchBackground`                               |
| `timeline`         | `timeline.root`     | `root`, `event`, `separator`, `marker`, `connector`, `content`                                                                    |
| `rating`           | `rating.root`       | `root`, `option`, `onIcon`, `offIcon`                                                                                             |
| `toggleswitch`     | `toggleswitch.root` | `root`, `input`, `control`, `handle`                                                                                              |
| `inputpassword`    | `inputtext`         | `root`                                                                                                                            |
| `dialog`           | `dialog.root`       | `backdrop`, `positioner`, `popup`, `header`, `title`, `close`, `content`, `footer`                                                |
| `datatable`        | `datatable.root`    | `root`, `tableContainer`, `table`, `head`, `theadRow`, `theadCell`, `body`, `row`, `cell`                                         |
| `stepper`          | `stepper.root`      | `root`, `list`, `step`, `header`, `number`, `title`, `separator`, `panels`, `panel`                                               |

`components3PrimeReact11PassThroughContract` is the machine-readable source of truth. Each entry also lists the rendered `data-scope` / `data-part` markers verified by the compatibility suite. The table covers the parts rendered by Components' supported compositions; it is not a copy of every optional PrimeReact part that an application could compose itself. Contract additions are compatible. A contracted slot or marker removal or rename requires a new Components major.

Use `primeReact11PassThroughSentinelPreset` and `assertPrimeReact11PassThroughCompatibility()` in a DOM test to verify the subset your application renders. See [Use fully unstyled mode](unstyled.md#verify-the-contract) for an example.

### Compatibility history

| Components major | PrimeReact major | Contract revision |
| ---------------- | ---------------- | ----------------- |
| 3                | 11               | 1                 |

## See also

- [CratisComponentsProvider](../Common/cratis-components-provider.md) — global `pt` / `unstyled` setup
- [Use fully unstyled mode](unstyled.md) — full `pt` preset walk-through
