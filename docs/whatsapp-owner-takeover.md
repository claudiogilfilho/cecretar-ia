# Assunção pelo proprietário no WhatsApp

## Decisão técnica

Para permitir que o proprietário atenda pelo próprio celular no mesmo número do agente, a CECRETAR.IA deve usar a modalidade oficial de **coexistência** entre WhatsApp Business App e WhatsApp Cloud API.

Nesse modelo, o proprietário continua usando o WhatsApp Business App com o número da empresa. As conversas são espelhadas com a Cloud API, e toda mensagem enviada pelo aplicativo gera um webhook `smb_message_echoes`. A CECRETAR.IA deve consumir esse evento, localizar a conversa correspondente e, quando o texto normalizado for `#assumir`, mudar o estado da conversa para atendimento humano.

O comando `#gente` permanece reservado ao interlocutor. Quando ele é recebido em uma mensagem de entrada de cliente, o agente interrompe a automação e solicita atendimento humano. Uma mensagem enviada pelo WhatsApp Business App, por sua vez, é identificada pelo webhook de eco e nunca é tratada como mensagem de cliente. Quando esse eco contém exatamente `#assumir`, a CECRETAR.IA registra a assunção e interrompe a automação daquela conversa.

## Requisitos de ativação

- O número deve estar no WhatsApp Business App versão 2.24.17 ou superior.
- A CECRETAR.IA deve usar Embedded Signup com o tipo de recurso `whatsapp_business_app_onboarding`.
- A plataforma deve assinar os webhooks `messages`, `smb_message_echoes`, `history` e `smb_app_state_sync`.
- A empresa precisa concluir o onboarding de coexistência e autorizar o compartilhamento de histórico, se desejar sincronização histórica.

## Estado da implementação

O adaptador da CECRETAR.IA já distingue mensagens de clientes, recebidas no campo `messages`, de ecos enviados pelo lado da empresa, recebidos no campo `smb_message_echoes`. O caminho de `#assumir` está coberto em teste integrado desde a normalização do payload até a mudança da conversa para atendimento humano.

Para ativar a coexistência em um número real ainda será necessário registrar o aplicativo Meta como Tech Provider ou Solution Partner, configurar o Embedded Signup e assinar os campos de Webhook indicados acima. Essas etapas dependem da conta Meta e não podem ser ativadas sem a autorização do proprietário.

## Referências

- Meta, [Onboard WhatsApp Business app users](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users).
- Meta, [About the WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform).
