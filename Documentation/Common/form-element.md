---
title: FormElement
description: Add a leading icon to an application-owned input.
---

`FormElement` places an icon beside ordinary form content using Cratis tokens and structural CSS.

```tsx
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { FormElement } from '@cratis/components/Common';

<FormElement icon={<FaMagnifyingGlass aria-hidden='true' />}>
    <input className='cratis-field-input' aria-label='Search' placeholder='Search' />
</FormElement>
```

`icon` and `children` are both required. The `cratis-field-input` class on the input comes from the CommandForm field stylesheet, which is part of `@cratis/components/styles`; with per-area stylesheets, import `@cratis/components/CommandForm/fields/styles` as well, or style the input yourself. The wrapper does not name the input: give it a `<label>`, `aria-label` or `aria-labelledby`, and keep the icon `aria-hidden`.

The wrapper is renderer-independent. It works with native controls, product-owned controls, and Components fields that accept child composition.
