import { chromium } from "playwright"

const EXEC =
  process.env.PLAYWRIGHT_BROWSERS_PATH +
  "/chromium-1200/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"

const mockProducts = {
  data: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      nombre_producto: "Tarjeta YA MultiPuntos Plus",
      banco: "Banco Cuscatlán",
      tipo_producto: "credit_card",
      source_url: "https://example.com",
      normalized: { anualidad: 0, tasa_interes: 32.5, beneficios: ["Puntos dobles"], requisitos: ["Mayor de edad"] },
      last_updated: null,
      disclaimer: "mock",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      nombre_producto: "Cuenta Débito Directo",
      banco: "Banco Agrícola",
      tipo_producto: "debit_card",
      source_url: "https://example.com",
      normalized: { anualidad: 0, beneficios: ["Sin comisión de manejo"] },
      last_updated: null,
      disclaimer: "mock",
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      nombre_producto: "Préstamo Personal Exprés",
      banco: "Banco Promerica",
      tipo_producto: "loan",
      source_url: "https://example.com",
      normalized: { tasa_interes: 12.5, requisitos: ["Ingreso mínimo $400"] },
      last_updated: null,
      disclaimer: "mock",
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      nombre_producto: "Cuenta de Ahorro Crece+",
      banco: "Banco Davivienda",
      tipo_producto: "savings",
      source_url: "https://example.com",
      normalized: { tasa_interes: 4.2, beneficios: ["Sin monto mínimo"] },
      last_updated: null,
      disclaimer: "mock",
    },
    {
      id: "55555555-5555-5555-5555-555555555555",
      nombre_producto: "Seguro de Vida Total",
      banco: "Banco Azul",
      tipo_producto: "insurance",
      source_url: "https://example.com",
      normalized: { beneficios: ["Cobertura hasta $50,000"] },
      last_updated: null,
      disclaimer: "mock",
    },
  ],
  count: 5,
  disclaimer: "mock",
}

const browser = await chromium.launch({
  executablePath: EXEC,
  headless: true,
  args: ["--crash-dumps-dir=/tmp/pw-crash-dumps", "--disable-crash-reporter"],
})

for (const theme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
  await page.route("**/api/v1/products/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockProducts) })
  })
  await page.addInitScript((t) => {
    window.localStorage.setItem("vite-ui-theme", t)
  }, theme)
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" })
  await page.waitForSelector("text=Tarjeta de crédito", { timeout: 10000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `/tmp/product-types-${theme}.png`, fullPage: true })
  await page.close()
}

await browser.close()
console.log("done")
