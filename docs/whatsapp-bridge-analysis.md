# Pontes de WhatsApp avaliadas para a CECRETAR.IA

## Objetivo

Conectar diretamente a CECRETAR.IA a um número de WhatsApp de teste, sem usar o GPT Maker como intermediário e sem contratar uma ponte paga para o piloto.

## O que o GPT Maker suporta publicamente

| Tipo de canal | Tecnologia associada | Possível uso direto pela CECRETAR.IA |
|---|---|---|
| `WHATSAPP` | WhatsApp Web por QR Code | Sim, por bibliotecas/servidores que emulam WhatsApp Web, mas não é recomendado para o produto |
| `Z_API` | Gateway comercial baseado em WhatsApp Web | Sim, mas exige fornecedor pago e não é o caminho oficial |
| `CLOUD_API` | WhatsApp Business Platform da Meta | Sim; é a recomendação para o piloto e para a futura plataforma |

## Conclusão

A ponte sem mensalidade de provedor que mantém a CECRETAR.IA independente é a **WhatsApp Business Platform Cloud API da Meta**, conectada diretamente ao backend do produto. Para o piloto, a Meta oferece recursos de teste; mensagens não-template enviadas dentro da janela de atendimento iniciada pelo usuário não têm cobrança da Meta. Não devem ser usados templates pagos no piloto inicial.

O método WhatsApp Web por QR Code é a alternativa tecnicamente gratuita que o GPT Maker também expõe, mas depende de sessão persistente do WhatsApp Web. Ferramentas de código aberto como Evolution API usam essa técnica (Baileys) e requerem serviço persistente, banco de dados e, tipicamente, Redis. Além da complexidade operacional, soluções não oficiais carregam risco de interrupção ou bloqueio do número e não são adequadas como base da CECRETAR.IA comercial.

## Decisão recomendada

1. Validar o agente no simulador atual.
2. Criar, quando o piloto estiver aprovado, um aplicativo Meta exclusivo da CECRETAR.IA.
3. Usar primeiro o número de teste criado automaticamente pela Meta ou o número separado indicado pelo usuário.
4. Conectar diretamente Webhook e envio da Cloud API ao backend da CECRETAR.IA.
5. Não usar GPT Maker, Z-API, Twilio ou WhatsApp Web como intermediários.

## Fontes

- GPT Maker — [Canais](https://developer.gptmaker.ai/agents/agent-channels.md)
- GPT Maker — [Criar canal](https://developer.gptmaker.ai/api-reference/channels/create-channel-workspace.md)
- Evolution API — [Repositório oficial](https://github.com/evolution-foundation/evolution-api)
- Meta — [Pricing on the WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- Meta — [About the WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform)
