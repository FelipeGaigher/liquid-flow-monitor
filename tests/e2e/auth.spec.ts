import { test, expect } from "@playwright/test";
import { blockApiRequests, seedMockState } from "./utils";

test("realiza login com credenciais validas", async ({ page }) => {
  await seedMockState(page);
  await blockApiRequests(page);

  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@tankcontrol.com");
  await page.getByLabel("Senha").fill("admin123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
