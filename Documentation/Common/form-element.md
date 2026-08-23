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

The wrapper is renderer-independent. It works with native controls, product-owned controls, and Components fields that accept child composition.
