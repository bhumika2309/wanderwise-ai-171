import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callLovableAI, extractToolArgs } from "./ai.server";
import type { ItineraryDay } from "./trip-types";

const generateSchema = z.object({
  destination: z.string().trim().min(1).max(100),
  days: z.number().int().min(1).max(14),
  budget: z.enum(["low", "medium", "high"]),
  interests: z.array(z.string().trim().min(1).max(40)).max(10),
});

const itineraryTool = {
  type: "function" as const,
  function: {
    name: "create_itinerary",
    description: "Return a structured day-by-day travel itinerary with timeline and budget.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Catchy 3-7 word trip title" },
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "integer" },
              title: { type: "string", description: "Short day theme" },
              summary: { type: "string", description: "1-2 sentence overview" },
              activities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    time: {
                      type: "string",
                      description: "Morning, Lunch, Afternoon, Evening, or Night",
                    },
                    startTime: {
                      type: "string",
                      description: "24-hour clock start time, e.g. '09:00'",
                    },
                    title: { type: "string" },
                    description: { type: "string" },
                    costEstimate: {
                      type: "number",
                      description: "Approximate cost per person in USD (0 if free)",
                    },
                  },
                  required: ["time", "startTime", "title", "description", "costEstimate"],
                  additionalProperties: false,
                },
              },
            },
            required: ["day", "title", "summary", "activities"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "days"],
      additionalProperties: false,
    },
  },
};

export const generateTrip = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => generateSchema.parse(input))
  .handler(async ({ data }) => {
    const interestsText =
      data.interests.length > 0 ? data.interests.join(", ") : "general sightseeing";

    const result = await callLovableAI({
      messages: [
        {
          role: "system",
          content:
            "You are an expert travel planner. Create realistic, well-paced day-by-day itineraries with a clear timeline (clock times) and a per-activity cost estimate in USD per person. Be specific about places, neighborhoods, and dishes. Keep descriptions concise (1-2 sentences). Always return your answer via the create_itinerary tool.",
        },
        {
          role: "user",
          content: `Plan a ${data.days}-day trip to ${data.destination}.
Budget tier: ${data.budget} (low ≈ backpacker, medium ≈ comfortable, high ≈ luxury).
Interests: ${interestsText}.
Include 4-6 activities per day mixing morning/lunch/afternoon/evening. For each activity provide a 24-hour startTime (e.g. "09:00") and a realistic costEstimate per person in USD that matches the budget tier (use 0 for free activities). Suggest specific local spots.`,
        },
      ],
      tools: [itineraryTool],
      tool_choice: { type: "function", function: { name: "create_itinerary" } },
    });

    const parsed = extractToolArgs<{ title: string; days: ItineraryDay[] }>(
      result,
      "create_itinerary"
    );
    return parsed;
  });

const regenSchema = z.object({
  destination: z.string().trim().min(1).max(100),
  budget: z.enum(["low", "medium", "high"]),
  interests: z.array(z.string().trim().min(1).max(40)).max(10),
  dayNumber: z.number().int().min(1).max(14),
  totalDays: z.number().int().min(1).max(14),
  hint: z.string().trim().max(300).optional(),
});

const dayTool = {
  type: "function" as const,
  function: {
    name: "create_day",
    description: "Return a single regenerated day for the itinerary.",
    parameters: {
      type: "object",
      properties: {
        day: { type: "integer" },
        title: { type: "string" },
        summary: { type: "string" },
        activities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time: { type: "string" },
              startTime: {
                type: "string",
                description: "24-hour clock start time, e.g. '09:00'",
              },
              title: { type: "string" },
              description: { type: "string" },
              costEstimate: {
                type: "number",
                description: "Approximate cost per person in USD (0 if free)",
              },
            },
            required: ["time", "startTime", "title", "description", "costEstimate"],
            additionalProperties: false,
          },
        },
      },
      required: ["day", "title", "summary", "activities"],
      additionalProperties: false,
    },
  },
};

export const regenerateDay = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => regenSchema.parse(input))
  .handler(async ({ data }) => {
    const interestsText =
      data.interests.length > 0 ? data.interests.join(", ") : "general sightseeing";
    const hint = data.hint ? `\nUser request for this day: ${data.hint}` : "";

    const result = await callLovableAI({
      messages: [
        {
          role: "system",
          content:
            "You are an expert travel planner. Regenerate a single day of an existing trip with fresh, specific suggestions, including a clock-time timeline and per-activity USD cost estimates per person. Always respond via the create_day tool.",
        },
        {
          role: "user",
          content: `Trip: ${data.destination}, ${data.totalDays} days, budget ${data.budget}, interests ${interestsText}.
Regenerate Day ${data.dayNumber} with 4-6 activities. Each activity must include a 24-hour startTime and a costEstimate per person in USD that matches the budget tier.${hint}`,
        },
      ],
      tools: [dayTool],
      tool_choice: { type: "function", function: { name: "create_day" } },
    });

    return extractToolArgs<ItineraryDay>(result, "create_day");
  });

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .min(1)
    .max(40),
});

export const chatAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => chatSchema.parse(input))
  .handler(async ({ data }) => {
    const result = await callLovableAI({
      messages: [
        {
          role: "system",
          content:
            "You are Wanderly, a friendly AI travel assistant. Help users plan trips, suggest destinations, build short itineraries, and answer travel questions. Keep replies concise, warm, and practical. Use markdown lists where helpful.",
        },
        ...data.messages,
      ],
    });

    const reply = result.choices?.[0]?.message?.content ?? "";
    return { reply };
  });
