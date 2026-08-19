import { invokeLLM, listLLMModels } from "./_core/llm";
import { Agent, ConversationMessage } from "../drizzle/schema";
import { extractQualification, isQualified, resolvePilotRule } from "./agentLogic";
import { appendHumanAvailabilityNotice } from "./conversationControl";

type ReplyInput = {
  agent: Agent;
  history: ConversationMessage[];
  incomingText: string;
  qualification: Record<string, string>;
};

const promptForAgent = (agent: Agent) => `Você é ${agent.name}, assistente de atendimento do Duconde Empresarial Boutique. Fale em português brasileiro, com cordialidade e objetividade. Nunca invente preços, disponibilidade ou condições. Use apenas os dados abaixo. Não faça perguntas forçadas; pergunte somente o que for útil para avançar o atendimento. Quando o interessado quiser falar com um humano, respeite imediatamente a palavra-chave configurada.\n\nEmpresa: ${agent.companyInfo}\nServiços: ${agent.services}\nPreços: ${agent.pricing}\nHorários: ${agent.businessHours}`;

export async function generateAgentReply(input: ReplyInput) {
  const rule = resolvePilotRule(input.incomingText, input.agent);
  const qualification = extractQualification(input.incomingText, input.qualification);

  if (rule) {
    return {
      reply: appendHumanAvailabilityNotice(rule.reply, rule.transferToHuman),
      transferToHuman: rule.transferToHuman,
      mediaIntent: rule.mediaIntent,
      qualification,
      qualified: isQualified(qualification),
      source: "rule" as const,
    };
  }

  if (input.agent.provider === "openai") {
    return {
      reply: appendHumanAvailabilityNotice("O provedor OpenAI está preparado na arquitetura, mas ainda precisa ser conectado com as credenciais da empresa. Enquanto isso, este agente continua no modo de teste CECRETAR.IA.", false),
      transferToHuman: false,
      mediaIntent: null,
      qualification,
      qualified: isQualified(qualification),
      source: "provider-pending" as const,
    };
  }

  try {
    const { data: models } = await listLLMModels();
    const model = models.find(modelItem => modelItem.id === "gpt-5-mini")?.id ?? models[0]?.id;
    const history = input.history.slice(-8).map(message => ({
      role: (message.role === "agent" ? "assistant" : "user") as "assistant" | "user",
      content: message.body,
    }));
    const response = await invokeLLM({
      model,
      messages: [
        { role: "system", content: promptForAgent(input.agent) },
        ...history,
        { role: "user", content: input.incomingText },
      ],
      maxTokens: 300,
    });
    const responseContent = response.choices[0]?.message?.content;
    const reply = typeof responseContent === "string" ? responseContent.trim() : "";
    if (!reply) throw new Error("Resposta vazia do provedor embutido");
    return {
      reply: appendHumanAvailabilityNotice(reply, false),
      transferToHuman: false,
      mediaIntent: null,
      qualification,
      qualified: isQualified(qualification),
      source: "embedded" as const,
    };
  } catch {
    return {
      reply: appendHumanAvailabilityNotice("Posso te ajudar com valores, estrutura, fotos, localização ou agendamento de visita. O que você gostaria de saber sobre as salas?", false),
      transferToHuman: false,
      mediaIntent: null,
      qualification,
      qualified: isQualified(qualification),
      source: "fallback" as const,
    };
  }
}
