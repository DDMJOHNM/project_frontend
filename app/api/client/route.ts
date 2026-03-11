import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { ClientData } from "@/app/components/Client";

const CLIENT_API_PATH = process.env.CLIENT_API_PATH || "/api/clients/add";

export async function POST(request: NextRequest) {
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL)?.replace(/\/$/, "");

  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 });
  }

  let body: Partial<ClientData>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const authToken = cookies().get("authToken")?.value ?? "";
  const url = `${backendUrl}${CLIENT_API_PATH.startsWith("/") ? "" : "/"}${CLIENT_API_PATH}`;

  const client: ClientData = {
    first_name: body.first_name ?? "",
    last_name: body.last_name ?? "",
    email: body.email ?? "",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: JSON.stringify(client),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let errorData: unknown;
    try {
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { message: errorBody || "Failed to save client" };
    }
    const response: Record<string, unknown> = {
      error: "Failed to save client",
      details: errorData,
      ...(res.status === 404 && {
        hint: "Backend returned 404. Check: (1) Backend running? (2) Logged in? (auth required) (3) Correct NEXT_PUBLIC_BACKEND_URL?",
        requested_url: url,
      }),
    };
    return NextResponse.json(response, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}
