---
title: 'Cratis Components ComponentPicker: inspect and edit'
description: Use Cratis Components ComponentPicker to identify UI elements, add application context, and propose presentation changes with optional live preview.
---

Cratis Components `ComponentPicker` lets a user select a rendered component so your app can attach feedback or propose presentation changes to the right part of the screen. The picker supplies component identity and editable properties; your app supplies context such as the screen or feature, and decides how to use or save the result.

Use it for an inspector, a guided-tour editor, or in-app feedback such as "this button should be called *Save draft*." Import the picker APIs from `@cratis/components/ComponentPicker`. The picker overlay needs no additional stylesheet.

## Component identity markers

The picker recognizes a component by `data-cratis-component="<Name>"` on its root element. A marked component can also expose a consumer-supplied `id` or `name` through `data-cratis-component-id`. These attributes identify the selection without guessing from class names.

```html
<button data-cratis-component="Button" data-cratis-component-id="save" data-cratis-part="root">…</button>
```

`data-cratis-part` identifies a part inside the component, such as `label`, `title` or `close`; `data-cratis-component` identifies the component itself. Some public components do not yet have their own marker. For an unmarked element, the picker selects its nearest marked ancestor, if one exists. The package's identity specs track marker coverage and require new public components to be accounted for.

## Pick a component

Render your screen under [CratisComponentsProvider](../Common/cratis-components-provider.md), then use `useComponentPicker()` to start and stop picking. Render the returned `picker` once under that provider and call `start()` when the user asks to select something:

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

In this example, confirming a component logs its name, optional id and presentation properties. The resolver adds `screen: 'orders-list'` to the result's `context`, so your feedback flow can associate the selection with that screen.

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

`resolve(element)` receives the picked component root and returns the application information you need alongside the selection. In the example above, the picker can identify a `Button`, but only your app knows that it belongs to the orders screen. Return that screen identity, or a feature identifier derived from the element, as `context`. Without a resolver, `context` is an empty object.

## Presentation properties

A presentation descriptor declares which props a component exposes to an editor, such as a button's `label` or a column's `header`. The picker reports those declared properties, not every prop or callback. A marked component without a registered descriptor can still be picked, but its `presentationProperties` list is empty.

For each declared property, `presentationProperties` includes editor metadata and the value registered from the component's rendered props. The picker reads these values from an in-memory registry, not from the DOM:

| Field | Meaning |
| --- | --- |
| `name`, `label`, `description` | The prop name and what an editor shows. |
| `type` | `string`, `boolean`, `number` or `enum`. |
| `values` | The allowed values of an `enum`. |
| `defaultValue` | What the component uses when the prop is not set. |
| `value` | The rendered string, number or boolean, or `undefined` when unset or not a plain value. |
| `editable` | `false` for non-primitive values, such as a `label` that is an element. Unset props remain editable. |

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

To make your own component pickable and editable, declare its presentation properties with `describeComponent`, then pass that descriptor and the incoming props to `useComponentPresentation`. The descriptor's property names are checked against the component's props. In this `Banner`, the editor can propose a headline or emphasis change; `onDismiss` is not exposed:

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

Render from the props returned by `useComponentPresentation`, as `Banner` does with `props.headline` and `props.emphasis`. They combine the incoming props with any live preview overrides, so a proposed change can appear without changing the caller's props. Spread the returned identity attributes on the root so the picker can find the component and its registered properties.

`knownComponentDescriptors()` lists the descriptors of components that have rendered so far.

## Highlight a component

`ComponentHighlight` is a passive outline for an element or a `PickedComponent`, used to show what a piece of feedback is about after picking. It never takes focus or pointer input and is hidden from assistive technology.

```tsx
<ComponentHighlight target={picked} />
```

## Propose changes with the property editor

Pass the selected `PickedComponent` to `PresentationPropertyEditor` to turn its descriptor into text, toggle, select and number inputs. By default, editing only reports a proposal as `{ property, from, to }[]`; it does not change the selected component. Your app decides whether to save that proposal and how to apply an accepted change.

```tsx
<PresentationPropertyEditor
    picked={picked}
    onChange={(changes) => setProposal(changes)}
/>
// changes: [{ property: 'label', from: 'Save', to: 'Save draft' }]
```

Here, `setProposal` keeps the proposed changes in your app's state. `onChange` receives `[]` when nothing differs from the picked values, and a property edited back to its original value drops out of the proposal. Keep the selection's identity and host context with the proposal if your app needs them for a review or save action.

### Preview live

Pass `preview` to `PresentationPropertyEditor` to show the proposal on the page while the user edits. The editor adds temporary overrides through the same registry the picker reads, and the selected component re-renders with them. It removes those overrides when a change is edited back, when `preview` turns off, or when the editor unmounts. Live preview does not save the proposal or update the caller's props.

If your app manages the editing UI itself, use `previewPresentationChanges` and retain the returned cleanup function:

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

- Follow [CratisComponentsProvider](../Common/cratis-components-provider.md) to configure the overlay environment before adding the picker to a screen.
- Use the [Dialog guide](../Dialogs/dialog.md) when the picking or editing flow needs a dialog that returns a result to its caller.
