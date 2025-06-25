import { describe, it, expect } from "vitest"

import App from "../src/App"

import { renderWithProviders } from "./test-utils"

describe("StatusPage smoke test", () => {
  it("mounts without crashing", () => {
    const { container } = renderWithProviders(<App />, { route: "/unknown-route" })
    expect(container).toBeTruthy()
  })
})
