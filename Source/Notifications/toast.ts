// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The imperative toast API. Call `toast(...)` for a plain toast, or
 * `toast.success/info/warn/error(...)` for a severity, `toast.promise(...)` to
 * track a promise, and `toast.dismiss(id?)` to close. Requires a {@link Toaster}
 * mounted somewhere in the tree.
 *
 * ```tsx
 * import { toast } from '@cratis/components/Notifications';
 * toast.success({ title: 'Saved' });
 * toast.error({ title: 'Failed', description: 'Please try again.' });
 * ```
 */
export { toast } from 'primereact/toaster';
export type { ToastType, ToastSeverity, ToastId } from '@primereact/types/primitive/toaster';
