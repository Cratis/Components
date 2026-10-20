---
title: FormElement
description: Add a leading icon to an application-owned input.
---

`FormElement` places a leading icon beside a form control using Cratis tokens and structural CSS. Use it when you own the input and only need an icon addon, rather than a new input implementation.

```tsx
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { FormElement } from '@cratis/components/Common';

<FormElement icon={<FaMagnifyingGlass aria-hidden='true' />}>
    <input className='cratis-field-input' aria-label='Search' placeholder='Search' />
</FormElement>
```

`icon` and `children` are both required. The `cratis-field-input` class on the input comes from the CommandForm field stylesheet, which is part of `@cratis/components/styles`; with per-area stylesheets, import `@cratis/components/CommandForm/fields/styles` as well, or style the input yourself. The wrapper does not name the input: give it a `<label>`, `aria-label` or `aria-labelledby`, and keep the icon `aria-hidden`.

The wrapper is renderer-independent. It works with native controls, product-owned controls, and Components fields that accept child composition.

## Control behavior

The wrapper renders the icon in an addon span before its children. Its structural CSS stretches the addon alongside the control and lets the content grow into the remaining width. It uses the secondary text, surface, control border, and border-radius tokens, so it follows the token values supplied by your application.

`FormElement` does not manage a value, handle changes, or forward input-specific props. Put `value`, `onChange`, `type`, `disabled`, and other native attributes on the input itself. Likewise, any validation message or form submission behavior belongs to the control or its surrounding form. The icon is decorative in the example; its presence is not an accessible label or a validation message.

Import the structural styles before expecting the addon border and alignment to appear. If you replace the input's CSS, keep its focus indicator visible and check that its dimensions still align with the addon.

## See also

- [Icon](icon.md) — supply React icon nodes
- [Basic controls](basic-controls.md) — use Components form controls
- [Per-area stylesheets](../Styling/per-area-stylesheets.md) — load only the styles you need
