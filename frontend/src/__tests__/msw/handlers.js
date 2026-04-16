import { http, HttpResponse } from "msw";

export const mockCustomers = [
  { id: 1, firstName: "Alice",  lastName: "Smith",    dateOfBirth: "1985-03-10", createdAt: "2026-01-01T10:00:00" },
  { id: 2, firstName: "Bob",    lastName: "Jones",    dateOfBirth: "1990-07-22", createdAt: "2026-01-02T10:00:00" },
  { id: 3, firstName: "Alicia", lastName: "Smithson", dateOfBirth: "1995-06-15", createdAt: "2026-01-03T10:00:00" },
];

export const mockSearchResult = {
  results: [
    { id: 1, firstName: "Alice",  lastName: "Smith",    dateOfBirth: "1985-03-10", score: 1.5 },
    { id: 3, firstName: "Alicia", lastName: "Smithson", dateOfBirth: "1995-06-15", score: 1.2 },
  ],
  totalHits: 2, totalPages: 1, page: 0, size: 20, query: "alice", took: 12,
};

export const handlers = [
  http.get("/api/v1/customers", () => HttpResponse.json(mockCustomers)),
  http.get("/api/v2/customers", () =>
    HttpResponse.json(mockCustomers.map(c => ({
      ...c, fullName: `${c.firstName} ${c.lastName}`, status: "ACTIVE",
    })))
  ),
  http.get("/api/v1/customers/:id", ({ params }) => {
    const c = mockCustomers.find(c => c.id === Number(params.id));
    return c ? HttpResponse.json(c)
      : HttpResponse.json({ status: 404, error: "Not Found", message: `Customer ${params.id} not found` }, { status: 404 });
  }),
  http.post("/api/v1/customers", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 99, ...body, createdAt: new Date().toISOString() }, { status: 201 });
  }),
  http.post("/api/v2/customers", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 99, ...body,
      fullName: `${body.firstName} ${body.lastName}`,
      status: "ACTIVE", createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),
  http.get("/api/v1/customers/search", ({ request }) => {
    const q = new URL(request.url).searchParams.get("query") ?? "";
    return HttpResponse.json(q ? mockSearchResult
      : { ...mockSearchResult, results: [], totalHits: 0 });
  }),
  http.post("/api/v2/customers/search", () => HttpResponse.json(mockSearchResult)),
  http.get("/api/v2/customers/suggest", ({ request }) => {
    const p = new URL(request.url).searchParams.get("prefix") ?? "";
    return HttpResponse.json(
      ["Alice", "Alicia", "Alison"].filter(s => s.toLowerCase().startsWith(p.toLowerCase()))
    );
  }),
];

export const errorHandlers = {
  createConflict: http.post("/api/v1/customers", () =>
    HttpResponse.json({ status: 409, error: "Conflict", message: "Customer already exists" }, { status: 409 })
  ),
  listFails: http.get("/api/v1/customers", () => HttpResponse.error()),
  searchFails: http.get("/api/v1/customers/search", () =>
    HttpResponse.json({ status: 500, message: "Search unavailable" }, { status: 500 })
  ),
};

// Handler for HttpClient test — 409 on specific firstName
handlers.push(
  http.post("/api/v1/customers", async ({ request }) => {
    const body = await request.json();
    if (body.firstName === "DUPLICATE") {
      return HttpResponse.json(
        { status: 409, error: "Conflict", message: "Already exists" },
        { status: 409 }
      );
    }
    return HttpResponse.json({ id: 99, ...body, createdAt: new Date().toISOString() }, { status: 201 });
  }, { once: false })
);
