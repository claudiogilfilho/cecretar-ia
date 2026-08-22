# Portabilidade e operação econômica — CECRETAR.IA

> **Escopo:** esta nota trata dos custos externos de IA e WhatsApp. Custos de publicação, hospedagem e consumo da plataforma onde o projeto estiver rodando devem ser confirmados diretamente com o respectivo provedor.

## Portabilidade do repositório

O projeto já separa a lógica de atendimento, os adaptadores de canal e o provedor de IA. Os módulos `agentLogic.ts`, `conversationControl.ts` e `whatsappCloud.ts` podem ser preservados quando outra equipe ou outra IA trabalhar sobre o repositório GitHub. A adaptação principal ficará concentrada no conector do provedor de IA, nas variáveis de ambiente, no banco de dados e na hospedagem.

| Camada | Situação atual | O que precisaria mudar em outra infraestrutura |
|---|---|---|
| Interface e regras do robô | React, TypeScript e regras determinísticas | Pode ser mantida quase integralmente. |
| Banco e mídia | Drizzle/MySQL e armazenamento S3 compatível | Migrar a conexão e as credenciais; manter o schema e as referências de arquivo. |
| Inteligência artificial | Adaptador plugável, com fluxo preparado para OpenAI | Trocar a implementação do provedor e a chave de API, sem reescrever os fluxos de atendimento. |
| WhatsApp | Cloud API oficial da Meta | Manter o adaptador; alterar apenas webhook, token e configuração da conta Meta. |

## Regras externas de cobrança verificadas

A Meta informa que, desde julho de 2025, a WhatsApp Business Platform cobra por **mensagem de template entregue**; mensagens não-template dentro da janela de atendimento aberta não são cobradas pela Meta. A janela é aberta quando a pessoa escreve para a empresa e dura 24 horas desde a última mensagem do usuário. Templates de utilidade enviados dentro dessa janela também não são cobrados. Mensagens de marketing, ou templates enviados fora da janela, usam a tabela por país, categoria e volume. [1]

Na tabela oficial da OpenAI, `gpt-5-mini` custa US$ 0,25 por milhão de tokens de entrada e US$ 2,00 por milhão de tokens de saída; `gpt-5-nano` custa US$ 0,05 e US$ 0,40, respectivamente. [2]

| Cenário ilustrativo de IA | Hipótese por resposta | 1.000 respostas | 5.000 respostas |
|---|---:|---:|---:|
| GPT-5 mini | 1.500 tokens de entrada + 250 de saída | US$ 0,875 | US$ 4,375 |
| GPT-5 nano | 1.500 tokens de entrada + 250 de saída | US$ 0,175 | US$ 0,875 |

Essas contas são apenas projeções de token. Elas não incluem hospedagem, armazenamento, câmbio, tributos, transcrição de áudio, mídia, nem mensagens de template da Meta.

## Diretrizes de economia

1. Resolver preços, localização, horários, mídias e agendamento por regras determinísticas antes de chamar a IA.
2. Usar um modelo econômico somente para mensagens abertas ou dúvidas sem regra pronta.
3. Enviar o histórico curto e a base de conhecimento estritamente relevante, evitando contexto desnecessário.
4. Priorizar atendimento reativo dentro da janela de 24 horas do WhatsApp; reservar templates para reativação, confirmação e campanhas justificadas.
5. Adotar limite mensal de uso por empresa, alertas de consumo e encaminhamento para humano em vez de deixar conversas longas e incertas.

## Quando uma pessoa precisa entrar

O piloto não precisa de uma equipe humana para cada mensagem. O robô deve ser a primeira linha do atendimento: acolhe, informa preço-base, localização e horários, envia as mídias salvas, coleta o interesse e conduz o pedido de visita. O painel já prevê dois comandos explícitos: `#gente`, acionado pelo interessado, e `#assumir`, acionado exclusivamente pelo proprietário.

| Situação | Quem atende | Motivo |
|---|---|---|
| Preço-base, estrutura, endereço, horário, fotos e áudios | Robô | São respostas padronizadas e já configuradas. |
| Captação inicial e qualificação de interesse | Robô | O agente registra nome, cidade, necessidade e urgência sem exigir uma pessoa em tempo integral. |
| Pedido explícito de atendimento humano (`#gente`) | Pessoa | Preferência do interessado; o robô interrompe a automação. |
| Negociação, desconto, contrato, vaga específica ou condição fora da regra | Pessoa | Exige decisão comercial e evita que o agente invente condição. |
| Reclamação, conflito, assunto sensível ou dúvida não coberta | Pessoa | Preserva confiança e reduz risco operacional. |
| Assunção ativa pelo dono (`#assumir`) | Proprietário | O dono passa a conduzir aquela conversa específica. |
| Confirmação final de visita enquanto o Google Calendar não estiver conectado | Pessoa | A disponibilidade atual é configurável, mas a sincronização externa ainda não está ativa. |

### Modelo operacional sugerido para o Duconde

Começar com **uma pessoa responsável** — o próprio proprietário ou a recepcionista — acompanhando somente a fila de transferências, em vez de manter um atendente dedicado ao chat. A rotina pode ser de revisão periódica das conversas que chegaram com `#gente`, propostas fora da regra ou pedido de visita. Depois de medir o volume real por algumas semanas, os gatilhos podem ser refinados.

Para reduzir a necessidade de pessoas sem reduzir qualidade, o robô deve transferir automaticamente após uma solicitação humana, uma segunda tentativa sem resposta útil para a dúvida, ou quando identificar palavras relacionadas a desconto, contrato, reclamação, urgência crítica ou informação indisponível. Essa última camada é uma evolução recomendada para o próximo ciclo do piloto.

## Referências

[1] [Meta — Pricing on the WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)

[2] [OpenAI — API Pricing](https://developers.openai.com/api/docs/pricing)
