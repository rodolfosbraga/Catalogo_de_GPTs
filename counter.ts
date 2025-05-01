// src/app/counter.ts - Template file, likely not used in final app, cleaning up ESLint error
// import { getRequestContext } from "@cloudflare/next-on-pages"; // Removed unused import
import { cookies } from "next/headers";

export const runtime = "edge";

export async function GET(/*request: Request*/) { // Commented out unused parameter
  const cookieStore = cookies();
  // Correctly access cookie value (cookies() returns a store, not a promise here)
  const countCookie = cookieStore.get("count");
  const count = Number(countCookie?.value ?? "0");

  // const { env, cf, ctx } = getRequestContext(); // unused for now
  // const headersList = headers(); // unused

  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Counter</title>
      </head>
      <body>
        <h1>Counter</h1>
        <p>Count: ${count}</p>
        <form method="post">
          <button type="submit">Increment</button>
        </form>
      </body>
    </html>
  `,
    {
      headers: {
        "content-type": "text/html;charset=UTF-8",
      },
    }
  );
}

export async function POST(/*request: Request*/) { // Commented out unused parameter
  const cookieStore = cookies();
  // Correctly access cookie value
  const countCookie = cookieStore.get("count");
  const count = Number(countCookie?.value ?? "0");

  cookieStore.set("count", String(count + 1));

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/counter", // Redirect back to the counter page
    },
  });
}

