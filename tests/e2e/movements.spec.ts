import { test, expect } from "@playwright/test";
import { blockApiRequests, loginAsAdmin, seedMockState } from "./utils";

test.beforeEach(async ({ page }) => {
  await seedMockState(page);
  await blockApiRequests(page);
  await loginAsAdmin(page);
  await page.goto("/movements");
});

test("cria movimentacao e exibe na tabela", async ({ page }) => {
  await page.getByRole("button", { name: "Nova Movimentação" }).click();

  await page.getByRole("button", { name: "Selecione o tanque" }).click();
  await page.getByRole("option", { name: /Tanque A1/ }).click();

  await page.getByPlaceholder("Ex: 1000").fill("500");
  await page.getByPlaceholder("Ex: 3.50").fill("3.75");
  await page.getByPlaceholder("Ex: NF-12345").fill("E2E-001");

  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByText("Sucesso!")).toBeVisible();
  await expect(page.getByText("E2E-001")).toBeVisible();
});
