// Server-only helper for calling the Lovable AI Gateway.
// Do NOT import from client code.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Msg = { role: "system" | "user" | "assistant"; content: string };

type Tool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

interface CallOpts {
  model?: string;
  messages: Msg[];
  tools?: Tool[];
  tool_choice?: { type: "function"; function: { name: string } };
}

export async function callLovableAI(opts: CallOpts) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const body = {
    model: opts.model ?? "google/gemini-2.5-flash",
    messages: opts.messages,
    ...(opts.tools ? { tools: opts.tools } : {}),
    ...(opts.tool_choice ? { tool_choice: opts.tool_choice } : {}),
  };

  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) {
    throw new Error("Rate limit exceeded. Please try again in a moment.");
  }
  if (resp.status === 402) {
    throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
  }
  if (!resp.ok) {
    const text = await resp.text();
    console.error("AI gateway error:", resp.status, text);
    throw new Error(`AI request failed (${resp.status})`);
  }

  return (await resp.json()) as {
    choices: Array<{
      message: {
        content: string | null;
        tool_calls?: Array<{
          id: string;
          type: "function";
          function: { name: string; arguments: string };
        }>;
      };
    }>;
  };
}

export function extractToolArgs<T = unknown>(
  result: Awaited<ReturnType<typeof callLovableAI>>,
  toolName: string
): T {
  const call = result.choices?.[0]?.message?.tool_calls?.find(
    (c) => c.function.name === toolName
  );
  if (!call) throw new Error(`AI did not return ${toolName} tool call`);
  try {
    return JSON.parse(call.function.arguments) as T;
  } catch {
    throw new Error(`AI returned invalid JSON for ${toolName}`);
  }
}
