// Vercel Node serverless function that wraps the TanStack Start SSR handler.
import handler from "../dist/server/server.js";

export const config = {
  runtime: "nodejs",
};

export default async function vercelHandler(
  req: Request
): Promise<Response> {
  return (handler as {
    fetch: (req: Request) => Promise<Response>;
  }).fetch(req);
}
