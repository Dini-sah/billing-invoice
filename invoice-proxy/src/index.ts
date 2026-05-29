/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

interface Env {
  GAS_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const GAS_URL = env.GAS_URL;
    if (!GAS_URL) {
      return new Response("Missing GAS_URL secret", { status: 500 });
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    const url = new URL(request.url);

    const init: RequestInit = {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (request.method === "POST") {
      init.body = await request.text();
    }

    const targetUrl =
      request.method === "GET"
        ? `${GAS_URL}${url.search}`
        : GAS_URL;

    const response = await fetch(targetUrl, init);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json",
      },
    });
  },
};

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
