import { invokeLLM, listLLMModels } from "./_core/llm";
import { Agent, ConversationMessage } from "../drizzle/schema";
import { extractQualification, isQualified, resolvePilotRule } from "./agentLogic";
import { appendHumanAvailabilityNotice } from "./conversationControl";
import { getBehaviorGuidance } from "./behaviorModes";

type ReplyInput = {
  agent: Agent;
  history: ConversationMessage[];
  incomingText: string;
  qualification: Record<string, string>;
  instructionText?: string;
};

const promptForAgent = (agent: Agent, instructionText?: string) => {
  const behavior = getBehaviorGuidance(agent.behaviorMode);
  return `Você é ${agent.name}, um assistente de atendimento em português brasileiro. Todos os atendimentos devem ser compreensivos, educados, respeitosos e sem pressão comercial. ${behavior.guidance} Nunca invente preços, disponibilidade, condições, fatos jurídicos, clínicos ou técnicos. Use somente os dados abaixo, admita quando não souber e ofereça atendimento humano com ${agent.transferKeyword} quando necessário.\n\nEspecialidade: ${agent.templateKey}\nEmpresa: ${agent.companyInfo}\nServiços: ${agent.services}\nPreços: ${agent.pricing}\nHorários: ${agent.businessHours}\n\nInstruções internas aprovadas:\n${instructionText?.trim() || "Nenhuma instrução adicional carregada."}`;
};

export function buildFallbackReply(agent: Pick<Agent, "services" | "pricing">) {
  const services = agent.services?.trim() || "os serviços configurados para este atendimento";
  const pricing = agent.pricing?.trim();
  const commercialContext = pricing ? `Sobre valores e condições: ${pricing}` : `Posso ajudar com informações sobre ${services}.`;
  return appendHumanAvailabilityNotice(`${commercialContext} Se precisar, também posso explicar os serviços e encaminhar seu atendimento.`, false);
}

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
        { role: "system", content: promptForAgent(input.agent, input.instructionText) },
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
      reply: buildFallbackReply(input.agent),
      transferToHuman: false,
      mediaIntent: null,
      qualification,
      qualified: isQualified(qualification),
      source: "fallback" as const,
    };
  }
}
