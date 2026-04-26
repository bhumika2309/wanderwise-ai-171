// Shared types for trips.
export type Activity = {
  time: string; // e.g. "Morning", "Lunch", "Afternoon", "Evening"
  title: string;
  description: string;
};

export type ItineraryDay = {
  day: number;
  title: string;
  summary: string;
  activities: Activity[];
};

export type Budget = "low" | "medium" | "high";
