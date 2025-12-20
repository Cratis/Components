// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import './Spinner.css';

export function Spinner() {
  return (
    <div className="pv-loading">
      <div className="pv-spinner">
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
