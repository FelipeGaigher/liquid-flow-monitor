import { test, expect } from "@playwright/test";
import { blockApiRequests, loginAsAdmin, seedMockState } from "./utils";

test.beforeEach(async ({ page }) => {
  await seedMockState(page);
  await blockApiRequests(page);
  await loginAsAdmin(page);
  await page.goto("/reports");
});

test("exporta relatorio de movimentacoes em CSV", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Relatorios" })).toBeVisible();

  const reportCard = page.getByRole("heading", { name: "Relatorio de Movimentacoes" }).locator("..");
  const downloadPromise = page.waitForEvent("download");
  await reportCard.getByRole("button", { name: "CSV" }).click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("relatorio-movimentacoes");
  await expect(page.getByText("Relatorio de movimentacoes exportado com sucesso!")).toBeVisible();
});
