import { describe, it, expect } from "vitest"

import App from "../src/App"

import { renderWithProviders } from "./test-utils"

describe("App smoke test", () => {
  it("mounts without crashing", () => {
    const { container } = renderWithProviders(<App />)
    expect(container).toBeTruthy()
  })
})
