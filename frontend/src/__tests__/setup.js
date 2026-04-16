import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { server }  from "./msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => { server.resetHandlers(); cleanup(); sessionStorage.clear(); });
afterAll(() => server.close());

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: jest.fn(() => ({ observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() })),
});
Object.defineProperty(window, "scrollTo", { writable: true, value: jest.fn() });
