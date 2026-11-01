---
title: ComponentPicker
description: Let a user point at a component on screen, highlight it, and read its name, id, rectangle, enclosing components and editable presentation properties.
---

`ComponentPicker` is the primitive behind features that let a user point at part of the screen and say something about it: an inspector, a guided-tour editor, in-app feedback ("this column header is confusing", "this button should be called *Save draft*"). It highlights the component under the pointer or keyboard cursor, names it, and returns a `PickedComponent` that describes it.

Everything lives behind one subpath: `@cratis/components/ComponentPicker`. The package ships no stylesheet for it, so there is nothing extra to import.

## Component identity markers

Every public component renders `data-cratis-component="<Name>"` on its root. When the consumer passes an `id` or a `name` (form fields already do), the root also renders `data-cratis-component-id`. This is how the picker knows what an element is; it never guesses from class names.

```html
<button data-cratis-component="Button" data-cratis-component-id="save" data-cratis-part="root">…</button>
```

`data-cratis-part` still marks the **parts** inside a component (`label`, `title`, `close`). The marker names the **component**. A conformance spec fails when a public component is added without the marker, and a coverage table in the package's specs records the components that are still being marked.

## Pick a component

`useComponentPicker()` starts and stops picking imperatively. Render the returned `picker` once, anywhere under the provider, and call `start()`:

```tsx
import { useComponentPicker } from '@cratis/components/ComponentPicker';

export function FeedbackButton() {
    const { start, picker, isPicking } = useComponentPicker({
        resolve: (element) => ({ screen: 'orders-list' }),
    });

    return (
        <>
            <button disabled={isPicking} onClick={async () => {
                const picked = await start();
                if (picked) console.log(picked.component, picked.id, picked.presentationProperties);
            }}>
                Point at something
            </button>
            {picker}
        </>
    );
}
```

`start()` resolves with the confirmed `PickedComponent`, or `null` when picking was cancelled or `cancel()` was called. Starting again cancels the previous pick.

### How the user picks

| Input | Effect |
| --- | --- |
| Pointer over the screen | The component root under the pointer is outlined and named in a tooltip. |
| Click, or Enter | Confirms the highlighted component. The click is swallowed, so the button under the pointer is not pressed. |
| Escape | Cancels. Inside a dialog it cancels the pick and does not close the dialog. |
| Arrow Up | Moves to the enclosing component. |
| Arrow Down | Moves to the first child component. |
| Arrow Left, Arrow Right | Moves to the previous or next component with the same parent. |

Keyboard focus is followed too: when focus moves, the component that contains it is highlighted. The picker announces the highlighted component through a polite live region and does not take focus.

### Inside dialogs

Picking honors the dialog stack. The overlay stacks above the topmost open dialog and everything it hosts (it uses the dialog tiers and the overlay environment that `CratisComponentsProvider` configures), and keyboard navigation stays inside the topmost dialog.

## What you get back

```ts
interface PickedComponent {
    component: string;                 // "Button"
    id?: string;                       // the consumer's id or name
    part?: string;                     // the data-cratis-part the pointer was on, e.g. "label"
    element: Element;                  // the component root
    rect: PickedRect;                  // viewport rectangle when picked
    presentationProperties: readonly PickedPresentationProperty[];
    ancestors: readonly PickedAncestor[]; // enclosing components, nearest first
    context: Record<string, unknown>;  // whatever the host's resolve returned
}
```

`ancestors` lets a user move to the parent: each entry has `component`, `id` and the `element`. Pass the ancestor's `element` to `describeComponentElement(element)` to turn it into a full `PickedComponent`.

### Add host context

`resolve(element)` is called with the picked component root. Return whatever the library cannot know, for example a screen identity or the application slice the element belongs to. The result is returned as `context`.

## Presentation properties

A component that declares presentation properties lists its **presentation props** only: the props that change how it looks or reads, such as `label`, `placeholder`, `variant`, `tone`, `size` or a column's `header`. Behavior and data props are left out.

`presentationProperties` holds one entry per descriptor property, with the value the component was rendered with, read from the rendered props through a registry and not from the DOM:

| Field | Meaning |
| --- | --- |
| `name`, `label`, `description` | The prop name and what an editor shows. |
| `type` | `string`, `boolean`, `number` or `enum`. |
| `values` | The allowed values of an `enum`. |
| `defaultValue` | What the component uses when the prop is not set. |
| `value` | The rendered value, or `undefined` when the prop is not set. |
| `editable` | `false` when the rendered value is not a plain string, number or boolean (for example a `label` that is an element). |

Components with descriptors today:

| Component | Marker | Properties |
| --- | --- | --- |
| `Button` | `Button` | `label`, `tooltip`, `variant`, `tone`, `shape`, `size` |
| `IconButton` | `IconButton` | `tooltip`, `variant`, `tone`, `shape`, `size` |
| `TextInput` | `TextInput` | `placeholder`, `invalid`, `disabled`, `readOnly`, `type` |
| `TextArea` | `TextArea` | `placeholder`, `rows`, `invalid`, `disabled`, `readOnly` |
| `Dialog` | `Dialog` | `title`, `placement`, `width`, `okLabel`, `cancelLabel` |
| `Page` | `Page` | `title`, `showTitle`, `panel` |
| Data table column header | `DataTableColumn` | `header`, `sortable`, `filter` |

`DataPage` renders a `Page` and is marked `DataPage`; its title is the `Page` title property.

### Describe your own component

A component opts in with `describeComponent` and `useComponentPresentation`. The descriptor's property names are checked against the component's props.

```tsx
import {
    describeComponent,
    useComponentPresentation,
} from '@cratis/components/ComponentPicker';

interface BannerProps { headline: string; emphasis?: 'low' | 'high'; onDismiss?: () => void }

const bannerDescriptor = describeComponent<BannerProps>('Banner', [
    { name: 'headline', label: 'Headline', type: 'string' },
    { name: 'emphasis', label: 'Emphasis', type: 'enum', values: ['low', 'high'], defaultValue: 'low' },
]);

export function Banner(incoming: BannerProps) {
    const [props, marker] = useComponentPresentation(bannerDescriptor, incoming);
    return <section {...marker} data-emphasis={props.emphasis}>{props.headline}</section>;
}
```

`useComponentPresentation` returns the **effective** props (the props you were given, plus any live preview) and the identity attributes to spread on the root. `knownComponentDescriptors()` lists the descriptors of components that have rendered so far.

## Highlight a component

`ComponentHighlight` is a passive outline for an element or a `PickedComponent`, used to show what a piece of feedback is about after picking. It never takes focus or pointer input and is hidden from assistive technology.

```tsx
<ComponentHighlight target={picked} />
```

## Propose changes with the property editor

`PresentationPropertyEditor` builds a form from a picked component's descriptor: text, toggle, select and number inputs. It reports the proposed changes as `{ property, from, to }[]` and **does not apply them**.

```tsx
<PresentationPropertyEditor
    picked={picked}
    onChange={(changes) => setProposal(changes)}
/>
// changes: [{ property: 'label', from: 'Save', to: 'Save draft' }]
```

`onChange` is called whenever the proposal changes, with `[]` when nothing differs from the rendered values. A property edited back to its original value drops out of the proposal.

### Preview live

Pass `preview` to show the proposal on the page while the user edits. The editor applies the changes through the same registry the picker reads; the component re-renders with them, and returns to exactly how it was when the change is edited back, when `preview` turns off, and when the editor unmounts.

A host can drive the same mechanism itself:

```ts
import { previewPresentationChanges } from '@cratis/components/ComponentPicker';

const revert = previewPresentationChanges(picked.element, changes);
// …later
revert(); // removes exactly these changes; calling it twice is harmless
```

## Accessibility

- The overlay does not take focus or pointer events; it mirrors the highlighted component in a polite live region.
- It is marked so React Aria does not hide it from assistive technology while a modal dialog is open.
- Every action has a keyboard path: arrows to move, Enter to confirm, Escape to cancel.
- The outline uses the focus-ring token and falls back to the system highlight color.

## Related

- [CratisComponentsProvider](../Common/cratis-components-provider.md) configures the overlay environment the picker portals into.
- [Dialog](../Dialogs/dialog.md) documents the dialog stack the picker stacks above.
