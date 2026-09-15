# NumberInputField

`NumberInputField` binds the standalone locale-aware [`NumberInput`](../Common/number-input.md) to a non-null number property in an Arc `CommandForm`.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { NumberInputField } from '@cratis/components/CommandForm';
import { UpdateSample } from './UpdateSample';

<CommandDialog command={UpdateSample} title='Update sample'>
    <NumberInputField<UpdateSample>
        value={(command) => command.amount}
        title='Amount'
        required
        min={0}
        step={0.01}
        minimumFractionDigits={2}
        maximumFractionDigits={2}
        suffix='kg'
    />
</CommandDialog>;
```

The adapter does not parse or format a second time. It reuses `NumberInput` and adds only CommandForm binding, title/error association, required-state propagation, blur validation, and the non-null command policy:

- the command default is `0`;
- clearing the nullable edit state writes `0` to the command property;
- extracted `null`, `undefined`, or non-finite values become `0`;
- all locale, grouping, fraction, range, step, adornment, callback, part, and token behavior belongs to `NumberInput`.

Use [`NumberField`](number-field.md) instead when the native `input[type=number]` behavior and its clear-to-zero contract are sufficient. The existing native field remains the smaller surface and does not add locale grouping, adornments, or a separate commit callback.
