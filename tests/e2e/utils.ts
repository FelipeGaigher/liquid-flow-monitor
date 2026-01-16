import type { Page } from "@playwright/test";
import { buildMockState } from "./fixtures/mock-state";

export async function seedMockState(page: Page) {
  const state = buildMockState();
  await page.addInitScript((mockState) => {
    window.localStorage.setItem("lfm.mock", JSON.stringify(mockState));
  }, state);
}

export async function blockApiRequests(page: Page) {
  await page.route("**/api/**", (route) => route.abort());
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@tankcontrol.com");
  await page.getByLabel("Senha").fill("admin123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
}
