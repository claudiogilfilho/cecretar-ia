export type AgentRuleConfig = {
  transferKeyword: string;
  pricing: string;
  businessHours: string;
  companyInfo: string;
};

export type QualificationSnapshot = Record<string, string>;

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function resolvePilotRule(input: string, config: AgentRuleConfig) {
  const text = normalizeText(input);
  const transferKeyword = normalizeText(config.transferKeyword);

  if (transferKeyword && text.includes(transferKeyword)) {
    return {
      intent: "transferencia_humana",
      transferToHuman: true,
      mediaIntent: null,
      reply: "Claro. Vou encaminhar esta conversa para uma pessoa da equipe, com todo o histórico do seu atendimento.",
    };
  }

  if (/(visita|visitar|conhecer o espaco|conhecer o local|agendar)/.test(text)) {
    return {
      intent: "agendamento_visita",
      transferToHuman: false,
      mediaIntent: null,
      reply: "Ótimo! Posso organizar uma visita ao Duconde Empresarial Boutique. Qual dia e faixa de horário ficam melhores para você?",
    };
  }

  if (/(preco|valor|quanto custa|mensalidade|aluguel)/.test(text)) {
    return {
      intent: "precos_salas",
      transferToHuman: false,
      mediaIntent: "precos_salas",
      reply: "Temos salas privativas a partir de R$ 1.500 por mês para até quatro pessoas. Para equipes maiores, há opções para até oito pessoas a partir de R$ 2.000. Todos os valores e condições podem ser confirmados na visita.",
    };
  }

  if (/(foto|imagem|como e a sala|modelo da sala|mostrar sala)/.test(text)) {
    return {
      intent: "fotos_salas",
      transferToHuman: false,
      mediaIntent: "fotos_salas",
      reply: "Separei as imagens mais adequadas das salas para você conhecer a estrutura.",
    };
  }

  if (/(endereco|localizacao|onde fica|rua)/.test(text)) {
    return {
      intent: "localizacao",
      transferToHuman: false,
      mediaIntent: null,
      reply: "O Duconde Empresarial Boutique fica na Rua Conde de Irajá, 910, Torre, na divisa com a Madalena. O CEP é 50610-100.",
    };
  }

  if (/(horario|funciona|recepcao|segunda|sexta)/.test(text)) {
    return {
      intent: "horarios",
      transferToHuman: false,
      mediaIntent: null,
      reply: `As visitas acontecem ${config.businessHours}. Ao chegar, procure a recepcionista no local.`,
    };
  }

  if (/(audio|ouvir|explicacao)/.test(text)) {
    return {
      intent: "audio_apresentacao",
      transferToHuman: false,
      mediaIntent: "audio_apresentacao",
      reply: "Vou compartilhar uma explicação em áudio para você entender melhor como funciona a locação.",
    };
  }

  return null;
}

export function extractQualification(input: string, previous: QualificationSnapshot = {}) {
  const text = input.trim();
  const normalized = normalizeText(text);
  const next = { ...previous };

  const nameMatch = text.match(/(?:me chamo|meu nome e|meu nome é|sou a|sou o)\s+([A-Za-zÀ-ÿ'\- ]{2,60})/i);
  if (nameMatch?.[1]) next.nome = nameMatch[1].trim();

  const cityMatch = text.match(/(?:moro em|sou de|cidade[:\s]+)\s+([A-Za-zÀ-ÿ'\- ]{2,60}?)(?=\s+(?:e\s+(?:preciso|quero|busco|procuro|tenho interesse)|mas|para)|,|\.|$)/i);
  if (cityMatch?.[1]) next.cidade = cityMatch[1].trim();

  if (/(urgente|urgencia|ainda hoje|o quanto antes|imediato)/.test(normalized)) next.urgencia = "Alta";
  if (/(sem pressa|proximos meses|mais pra frente)/.test(normalized)) next.urgencia = "Baixa";

  const budgetMatch = text.match(/(?:orcamento|orçamento|posso pagar|ate|até)\s*(?:de)?\s*(r?\$?\s*[\d.]+(?:,\d{2})?)/i);
  if (budgetMatch?.[1]) next.orcamento = budgetMatch[1].replace(/\s+/g, " ").trim();

  if (/(preciso|quero|busco|procuro|interesse)/.test(normalized)) next.necessidade = text;

  return next;
}

export function isQualified(snapshot: QualificationSnapshot) {
  return Boolean(snapshot.nome && snapshot.cidade && snapshot.necessidade);
}
