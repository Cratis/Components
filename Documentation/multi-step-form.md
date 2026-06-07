---
title: "Recipe: Multi-step form"
description: Gather a command's input across several named steps with StepperCommandDialog.
sidebar:
  order: 5
---

**Goal:** one command needs more input than fits comfortably on a single screen. Split it into a wizard — named steps the user moves through — that still executes a single command at the end.

## Use StepperCommandDialog

`StepperCommandDialog` is `CommandDialog` with stages. You group fields into `StepperPanel`s; it handles next/back navigation, per-step validation, and runs the command when the last step is confirmed:

```tsx
import { StepperCommandDialog } from '@cratis/components/CommandDialog';
import { StepperPanel } from 'primereact/stepperpanel';
import { InputTextField, DropdownField } from '@cratis/components/CommandForm';
import { RegisterMember } from './RegisterMember';   // generated proxy

export const RegisterMemberWizard = () => (
    <StepperCommandDialog<RegisterMember> command={RegisterMember} title="Register member">
        <StepperPanel header="Details">
            <InputTextField<RegisterMember> value={i => i.name} title="Name" />
            <InputTextField<RegisterMember> value={i => i.email} title="Email" />
        </StepperPanel>
        <StepperPanel header="Membership">
            <DropdownField<RegisterMember> value={i => i.tier} title="Tier" options={tierOptions} />
        </StepperPanel>
    </StepperCommandDialog>
);
```

## Notes

- **One command, many steps.** Every field across every panel maps to the *same* command — the wizard is just how you collect it. The command still validates and executes once.
- **Per-step validation.** The user can't advance past a step whose required fields are invalid; use `validateOnInit` if you need a step validated as soon as it's shown.
- **Required values that aren't inputs** still go through `initialValues` (not `onBeforeExecute`), same as a single-step dialog — see [Building a form](/components/building-a-form/).

## When to use a wizard vs. a plain dialog

Reach for a wizard when the input is genuinely staged or long enough that one screen would overwhelm. For three or four fields, a single [CommandDialog](/components/building-a-form/) is friendlier — don't add steps for their own sake.

## Next

- [Building a form](/components/building-a-form/) — the single-step version and the field set.
- The full stepper options are in the Components reference and Storybook.
