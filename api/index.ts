// Vercel Node serverless function that wraps the TanStack Start SSR handler.
// The build output lives in /dist/server/server.js (ESM with a default { fetch } export).
import handler from "../dist/server/server.js";

export const config = { runtime: "nodejs20.x" };

export default async function vercelHandler(req: Request): Promise<Response> {
  return (handler as { fetch: (req: Request) => Promise<Response> }).fetch(req);
}
