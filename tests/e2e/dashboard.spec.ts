import { test, expect } from "@playwright/test";
import { blockApiRequests, loginAsAdmin, seedMockState } from "./utils";

test.beforeEach(async ({ page }) => {
  await seedMockState(page);
  await blockApiRequests(page);
  await loginAsAdmin(page);
});

test("exibe KPIs e tanques no dashboard", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Faturamento")).toBeVisible();
  await expect(page.getByText("Volume Vendido")).toBeVisible();
  await expect(page.getByText("Lucro")).toBeVisible();
  await expect(page.getByText("Tanques")).toBeVisible();
  await expect(page.getByText("Tanque A1")).toBeVisible();
});
