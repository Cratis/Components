// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export interface Version {
  id: string;
  timestamp: Date;
  label: string;
  content: React.ReactNode;
  events?: Event[];
}

export interface Event {
  sequenceNumber: number;
  type: string;
  occurred: Date;
  content: Record<string, unknown>;
}

export interface TimelineEntry {
  id: string;
  timestamp: Date;
  label: string;
}
