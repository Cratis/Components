// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.


export function Spinner({ label }: { label: string }) {
  return (
    <div className="pv-loading" role="status">
      <span className="cratis:sr-only">{label}</span>
      <div className="pv-spinner" aria-hidden="true">
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
      </div>
    </div>
  );
}
