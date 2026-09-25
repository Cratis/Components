---
title: "Recipe: Multi-step form"
description: Gather a command's input across several named steps with StepperCommandDialog.
---

**Goal:** one command needs more input than fits comfortably on a single screen. Split it into a wizard — named steps the user moves through — that still executes a single command at the end.

## Use StepperCommandDialog

`StepperCommandDialog` is `CommandDialog` with stages. You group fields into `StepperPanel`s; it handles next/back navigation, per-step validation, and runs the command when the last step is confirmed:

```tsx title="RegisterMemberWizard.tsx"
import { useState } from 'react';
import { Guid } from '@cratis/fundamentals';
import { StepperCommandDialog, StepperPanel } from '@cratis/components/CommandDialog';
import { DropdownField, InputTextField } from '@cratis/components/CommandForm';
import { RegisterMember } from './RegisterMember'; // generated proxy

const tiers = [
    { id: 'standard', name: 'Standard' },
    { id: 'premium', name: 'Premium' },
];

export const RegisterMemberWizard = () => {
    const [memberId] = useState(() => Guid.create());
    return (
        <StepperCommandDialog<RegisterMember>
            command={RegisterMember}
            title='Register member'
            initialValues={{ memberId }}
        >
            <StepperPanel header='Details'>
                <InputTextField<RegisterMember> value={(command) => command.name} title='Name' />
                <InputTextField<RegisterMember> value={(command) => command.email} title='Email' type='email' />
            </StepperPanel>
            <StepperPanel header='Membership'>
                <DropdownField<RegisterMember>
                    value={(command) => command.tier}
                    title='Tier'
                    options={tiers}
                    optionValue='id'
                    optionLabel='name'
                />
            </StepperPanel>
        </StepperCommandDialog>
    );
};
```

The example assumes a `RegisterMember` command with a required `memberId` and `name`, `email`, and `tier` properties. `DropdownField` needs `optionValue` and `optionLabel` to know which option property is stored on the command and which one is shown. Open the wizard with `useDialog`, exactly like a single-step [CommandDialog](building-a-form.md#show-the-dialog).

## Notes

- **One command, many steps.** Every field across every panel maps to the *same* command — the wizard is just how you collect it. The command still validates and executes once.
- **Per-step validation.** **Next** is disabled while a field on the current step shows a validation error, and a visited step with an error is marked invalid. A field shows no error until it has been validated (on blur by default), so an untouched required field doesn't block **Next** — but on the last step the submit button is only rendered once the whole command is valid. Set `validateOnInit` to show every error as soon as the wizard opens.
- **Required values that aren't inputs**, like `memberId` above, still go through `initialValues` (not `onBeforeExecute`), same as a single-step dialog — see [Building a form](building-a-form.md#tips).

## When to use a wizard vs. a plain dialog

Reach for a wizard when the input is genuinely staged or long enough that one screen would overwhelm. For three or four fields, a single [CommandDialog](CommandDialog/index.md) is friendlier — don't add steps for their own sake.

## Next

- [Building a form](building-a-form.md) — the single-step recipe and the field set
- [StepperCommandDialog](StepperCommandDialog/index.md) — modal navigation, validation, callbacks, cancellation, and busy state
- [CommandStepper](CommandStepper/index.md) — execute the same kind of multi-step command inline
