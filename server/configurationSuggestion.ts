import { lookup } from "node:dns/promises";
import { invokeLLM, listLLMModels } from "./_core/llm";

export type BusinessConfigurationSuggestion = {
  name: string;
  persona: string;
  companyInfo: string;
  services: string;
  pricing: string;
  businessHours: string;
  websiteUrl?: string;
  instagramHandle?: string;
  note: string;
};

const privateIp = /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;

export function normalizeInstagramHandle(value?: string) {
  if (!value) return undefined;
  const handle = value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "");
  return handle || undefined;
}

export function validatePublicWebsiteUrl(value?: string) {
  if (!value) return undefined;
  const url = new URL(value.startsWith("http") ? value : `https://${value}`);
  if (!["https:", "http:"].includes(url.protocol) || !url.hostname || url.hostname === "localhost" || url.hostname.endsWith(".local") || privateIp.test(url.hostname)) {
    throw new Error("Informe um site público válido. Endereços internos não podem ser analisados.");
  }
  return url.toString();
}

async function fetchPublicText(url: string) {
  const host = new URL(url).hostname;
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some(address => privateIp.test(address.address) || address.address === "::1" || address.address.startsWith("fc") || address.address.startsWith("fd"))) {
    throw new Error("O endereço informado não está disponível para análise pública.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "manual", headers: { "User-Agent": "CECRETAR.IA onboarding" } });
    if (!response.ok || response.type === "opaqueredirect") throw new Error("Não foi possível ler o conteúdo público informado.");
    const html = await response.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12_000);
  } finally {
    clearTimeout(timeout);
  }
}

const suggestionSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "business_configuration_suggestion",
    strict: true,
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        persona: { type: "string" },
        companyInfo: { type: "string" },
        services: { type: "string" },
        pricing: { type: "string" },
        businessHours: { type: "string" },
        note: { type: "string" },
      },
      required: ["name", "persona", "companyInfo", "services", "pricing", "businessHours", "note"],
      additionalProperties: false,
    },
  },
};

export async function createBusinessConfigurationSuggestion(input: {
  current: BusinessConfigurationSuggestion;
  websiteUrl?: string;
  instagramHandle?: string;
}) {
  const websiteUrl = validatePublicWebsiteUrl(input.websiteUrl);
  const instagramHandle = normalizeInstagramHandle(input.instagramHandle);
  let sourceText = "";
  let sourceWarning = "";
  if (websiteUrl) {
    try {
      sourceText = await fetchPublicText(websiteUrl);
    } catch (error) {
      sourceWarning = error instanceof Error ? error.message : "O site não pôde ser lido.";
    }
  }
  const fallback: BusinessConfigurationSuggestion = {
    ...input.current,
    websiteUrl,
    instagramHandle,
    note: sourceWarning || "Sugestão inicial baseada no modelo escolhido. Revise todas as informações antes de publicar.",
  };
  if (!sourceText) return fallback;
  try {
    const { data: models } = await listLLMModels();
    const model = models.find(item => item.id === "gpt-5-mini")?.id ?? models.find(item => item.id === "gpt-5")?.id;
    if (!model) return fallback;
    const response = await invokeLLM({
      model,
      maxTokens: 900,
      response_format: suggestionSchema,
      messages: [
        { role: "system", content: "Você transforma informações públicas de um site em um rascunho de configuração de assistente. Não invente preços, horários, certificações, disponibilidade, promessas de resultado, orientações jurídicas, médicas ou financeiras. Preserve as salvaguardas existentes. Quando uma informação não estiver clara, use uma formulação neutra e peça revisão humana. Responda somente o JSON solicitado." },
        { role: "user", content: `Configuração-base:\n${JSON.stringify(input.current)}\n\nSite público analisado:\n${sourceText}\n\nInstagram público informado: ${instagramHandle ? `@${instagramHandle}` : "não informado"}` },
      ],
    });
    const text = response.choices[0]?.message?.content;
    if (!text || typeof text !== "string") return fallback;
    const parsed = JSON.parse(text) as Omit<BusinessConfigurationSuggestion, "websiteUrl" | "instagramHandle">;
    return { ...parsed, websiteUrl, instagramHandle };
  } catch {
    return fallback;
  }
}
