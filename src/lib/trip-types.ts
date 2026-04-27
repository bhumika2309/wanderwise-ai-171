// Shared types for trips.
export type Activity = {
  time: string; // e.g. "Morning", "Lunch", "Afternoon", "Evening"
  startTime?: string; // clock time, e.g. "09:00"
  title: string;
  description: string;
  costEstimate?: number; // approximate cost per person, in USD
};

export type ItineraryDay = {
  day: number;
  title: string;
  summary: string;
  activities: Activity[];
};

export type Budget = "low" | "medium" | "high";
