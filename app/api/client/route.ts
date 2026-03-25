import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ClientData } from "@/app/components/Client";

const CLIENT_API_PATH = process.env.CLIENT_API_PATH || "/api/clients/add";
/** GET request path on the backend (query `email` is appended). Override if your API differs. */
const CLIENT_GET_PATH = process.env.CLIENT_GET_PATH || "/api/clients/by-email";
/** PUT `{base}{CLIENT_UPDATE_PATH}/{client_id}` — initial consult notes. Default `/api/clients/update`. */
const CLIENT_UPDATE_PATH = process.env.CLIENT_UPDATE_PATH || "/api/clients/update";

function normalizeClientPayload(body: unknown): ClientData {
  const r = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const nested = r.data && typeof r.data === "object" ? (r.data as Record<string, unknown>) : {};
  const src = { ...nested, ...r };
  const idRaw = src.client_id ?? src.clientId ?? src.id;
  return {
    ...(idRaw != null && String(idRaw).trim() !== "" && { client_id: String(idRaw) }),
    first_name: String(src.first_name ?? ""),
    last_name: String(src.last_name ?? ""),
    email: String(src.email ?? ""),
    ...(src.requested_counsellor != null && { requested_counsellor: String(src.requested_counsellor) }),
    ...(src.initial_consult_notes != null && { initial_consult_notes: String(src.initial_consult_notes) }),
    ...(src.next_appointment != null && { next_appointment: String(src.next_appointment) }),
    ...(src.urgency != null && { urgency: String(src.urgency) }),
  };
}

export async function GET(request: NextRequest) {
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL)?.replace(/\/$/, "");

  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 });
  }

  const email = request.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "Query parameter \"email\" is required" }, { status: 400 });
  }

  const authToken = cookies().get("authToken")?.value ?? "";
  const base = `${backendUrl}${CLIENT_GET_PATH.startsWith("/") ? "" : "/"}${CLIENT_GET_PATH}`;
  const url = `${base}${base.includes("?") ? "&" : "?"}email=${encodeURIComponent(email)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let errorData: unknown;
    try {
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { message: errorBody || "Failed to load client" };
    }
    return NextResponse.json(
      {
        error: "Failed to load client",
        details: errorData,
        ...(res.status === 404 && {
          hint: "Check CLIENT_GET_PATH and that the backend exposes GET by email.",
          requested_url: url,
        }),
      },
      { status: res.status },
    );
  }

  const raw = await res.json();
  return NextResponse.json(normalizeClientPayload(raw));
}

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
    ...(body.client_id != null &&
      String(body.client_id).trim() !== "" && {
        client_id: String(body.client_id),
      }),
    ...(body.initial_consult_notes != null && {
      initial_consult_notes: String(body.initial_consult_notes),
    }),
    ...(body.requested_counsellor != null && {
      requested_counsellor: String(body.requested_counsellor),
    }),
    ...(body.next_appointment != null && {
      next_appointment: String(body.next_appointment),
    }),
    ...(body.urgency != null && {
      urgency: String(body.urgency),
    }),
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
  return NextResponse.json({ success: true, data, client: normalizeClientPayload(data) });
}

/** PUT initial consult notes or counsellor selection: backend expects `PUT /api/clients/update/:client_id` with `{ notes: { date, client_id, note } }` for notes, or `{ client_id, requested_counsellor, urgency }` for counsellor. */
export async function PUT(request: NextRequest) {
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL)?.replace(/\/$/, "");

  if (!backendUrl) {
    return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 });
  }

  let body: { client_id?: string; note?: string; requested_counsellor?: string; urgency?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  const authToken = cookies().get("authToken")?.value ?? "";
  const base = `${backendUrl}${CLIENT_UPDATE_PATH.startsWith("/") ? "" : "/"}${CLIENT_UPDATE_PATH}`.replace(/\/$/, "");
  const url = `${base}/${encodeURIComponent(clientId)}`;

  let payload: unknown;
  if (body.note != null) {
    // Notes update
    const note = String(body.note);
    payload = {
      notes: {
        date: new Date().toISOString(),
        client_id: clientId,
        note,
      },
    };
  } else if (body.requested_counsellor != null || body.urgency != null) {
    // Counsellor update
    payload = {
      client_id: clientId,
      ...(body.requested_counsellor != null && { requested_counsellor: String(body.requested_counsellor) }),
      ...(body.urgency != null && { urgency: String(body.urgency) }),
    };
  } else {
    return NextResponse.json({ error: "Invalid update payload: must include 'note' or 'requested_counsellor'/'urgency'" }, { status: 400 });
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    let errorData: unknown;
    try {
      errorData = JSON.parse(errorBody);
    } catch {
      errorData = { message: errorBody || "Failed to update client" };
    }
    return NextResponse.json(
      {
        error: "Failed to update client",
        details: errorData,
        ...(res.status === 404 && {
          hint: "Check CLIENT_UPDATE_PATH and that the backend exposes PUT for updates.",
          requested_url: url,
        }),
      },
      { status: res.status },
    );
  }

  const text = await res.text();
  if (!text.trim()) {
    return NextResponse.json({ success: true });
  }

  try {
    const data = JSON.parse(text) as unknown;
    return NextResponse.json({ success: true, data, client: normalizeClientPayload(data) });
  } catch {
    return NextResponse.json({ success: true });
  }
}
