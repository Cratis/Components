---
title: 'AutoCommandFields: generate fields inside an existing form or dialog'
description: AutoCommandFields generates input fields from the host command's property descriptors inside an existing CommandForm or CommandDialog.
---

`AutoCommandFields` generates the field list from the command's property descriptors, like [AutoCommandForm](auto-command-form.md), but renders no form of its own. Put it inside a `CommandForm` or a `CommandDialog` and it uses that host's command instance, validation, and execution.

Use it when the host is already there and you want generated fields, possibly next to a few handwritten ones. Use `AutoCommandForm` when you want the whole form generated, and use handwritten fields when you need individual titles, placement, or input-specific props.

## Inside a command dialog

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { AutoCommandFields } from '@cratis/components/CommandForm';

<CommandDialog command={RenameProject} title='Rename project'>
    <AutoCommandFields<RenameProject> exclude={['projectId']} />
</CommandDialog>
```

The provider lookup, titles, `fieldName` binding, `exclude`, and the omission of properties with no registered provider are the same as for `AutoCommandForm`. Each generated field binds itself to the host's command context, so edits reach the command the host executes.

## Props

| Prop | Description |
| --- | --- |
| `exclude` | Property names to leave out of the generated list. |
| `currentValues` | A read-only reset hint: the same `currentValues` overlay passed to the host. It never writes values. |

## The reset hint

An unfinished `GuidField` draft is discarded when the host's `currentValues` overlay changes the property. `AutoCommandFields` needs to see that overlay to do this. Inside `CommandDialog` it reads the dialog's own `currentValues` automatically. Inside a plain Arc `CommandForm`, pass the same object to both:

```tsx
const overlay = { projectId: selectedProjectId };

<CommandForm command={RenameProject} currentValues={overlay}>
    <AutoCommandFields<RenameProject> currentValues={overlay} />
</CommandForm>
```

## Limits

- Supported hosts are `CommandForm` and `CommandDialog`. Steppers are not supported.
- The fields render in a plain fragment, so do not use `AutoCommandFields` inside `CommandForm.Column` layouts.
- There is no per-field customisation and no discovery inside nested components. Use handwritten fields for those.
- Rendered outside a host, it throws: `AutoCommandFields must be rendered inside a CommandForm or CommandDialog.`
