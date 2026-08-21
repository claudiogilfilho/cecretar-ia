export const BEHAVIOR_MODES = {
  objective: {
    label: "Objetivo",
    description: "Respostas curtas, diretas e focadas no próximo passo.",
    guidance: "Seja acolhedor e educado, porém conciso. Dê a informação principal primeiro e faça no máximo uma pergunta útil por vez.",
  },
  balanced: {
    label: "Equilibrado",
    description: "Clareza comercial com explicações suficientes para orientar bem.",
    guidance: "Seja compreensivo, educado e claro. Explique o necessário sem excesso de detalhes e conduza a conversa com tranquilidade.",
  },
  consultative: {
    label: "Consultivo",
    description: "Atendimento mais detalhado, orientador e acolhedor.",
    guidance: "Seja muito gentil, paciente e didático. Entenda a necessidade antes de sugerir caminhos e ofereça contexto útil sem pressionar a decisão.",
  },
} as const;

export type BehaviorMode = keyof typeof BEHAVIOR_MODES;

export function getBehaviorGuidance(mode: string | null | undefined) {
  return BEHAVIOR_MODES[(mode as BehaviorMode) in BEHAVIOR_MODES ? mode as BehaviorMode : "balanced"];
}
