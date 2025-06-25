import { describe, it, expect } from "vitest"

import App from "../src/App"

import { renderWithProviders } from "./test-utils"

describe("EditPage smoke test", () => {
  it("mounts without crashing", () => {
    const { container } = renderWithProviders(<App />, { route: "/projects/new" })
    expect(container).toBeTruthy()
  })
})
