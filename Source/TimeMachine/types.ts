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
  content: Record<string, any>;
}

export interface TimelineEntry {
  id: string;
  timestamp: Date;
  label: string;
}
