# Decisão preliminar — canal WhatsApp do Duconde

## Recomendação para o piloto

Usar a **WhatsApp Business Platform Cloud API diretamente pela Meta**, com a CECRETAR.IA como camada de atendimento, regras, IA, mídia, histórico, agendamento e atendimento humano. A plataforma não deve depender do GPT Maker, Twilio ou outro construtor de bot para operar as mensagens do piloto.

## Motivos

| Critério | Cloud API direta | Provedor intermediário |
|---|---|---|
| Controle de dados, fluxos e experiência | A CECRETAR.IA controla a integração | Parte do fluxo e das limitações fica no provedor |
| Custo recorrente do conector | Sem mensalidade de intermediário; aplicar apenas custos Meta e infraestrutura | Twilio cobra taxa por mensagem; 360dialog cobra mensalidade por número, além das tarifas Meta |
| Evolução para SaaS multiempresa | Compatível com Embedded Signup para cada cliente conectar sua própria conta | Pode simplificar suporte, mas aumenta dependência e custo por cliente |
| Piloto seguro | Meta cria WABA e número de teste automaticamente | Depende da política comercial de cada provedor |

## Arquitetura desejada

1. O Duconde mantém a propriedade de sua conta empresarial/WABA e do número.
2. A Meta App da CECRETAR.IA recebe Webhooks de mensagens e status.
3. O backend da CECRETAR.IA identifica a empresa e o agente, chama o motor de IA e envia a resposta pela Cloud API.
4. Para clientes futuros, a CECRETAR.IA usará Embedded Signup para conectar o WABA e o número de cada empresa dentro do próprio produto.

## Migração do número atual

Antes de alterar o número já operado pelo GPT Maker, identificar se ele está vinculado a uma WABA própria do Duconde ou a uma WABA do provedor. A Meta recomenda Embedded Signup para migrações orientadas pelo cliente. A migração deve ocorrer somente após o teste de ponta a ponta usando o número de teste fornecido pela Meta.

## Fontes consultadas

- Meta — [About the WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform)
- Meta — [WhatsApp Cloud API Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started)
- Meta — [Migrating a business phone number](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/support/migrating-phone-numbers-among-solution-partners-programmatically)
- Twilio — [WhatsApp pricing](https://www.twilio.com/en-us/whatsapp/pricing)
- 360dialog — [WhatsApp Business pricing](https://360dialog.com/pricing)
