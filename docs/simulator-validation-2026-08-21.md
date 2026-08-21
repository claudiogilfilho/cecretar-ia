# Validação interna do simulador — 21/08/2026

| Cenário | Entrada executada | Resultado observado | Situação |
|---|---|---|---|
| Informações e preço | `Quais são os valores?` | O simulador informou R$ 1.500 para salas de até quatro pessoas, R$ 2.000 para opções de até oito pessoas, orientou confirmação na visita e reiterou `#gente`. | Aprovado |
| Agenda | `Quero agendar um horário` | O simulador reconheceu a intenção de visita, pediu o dia e a faixa de horário e reiterou `#gente`. | Aprovado |
| Transferência humana | `Quero falar com #gente` | O simulador exibiu a confirmação visual de transferência e respondeu que a conversa seria encaminhada para uma pessoa da equipe com o histórico. | Aprovado |
| Mídia vinculada | `Você pode me enviar fotos?` | O simulador reconheceu o pedido e retornou a resposta associada à intenção `fotos_salas`. A biblioteca do especialista estava vazia nesta execução; portanto, o envio de um arquivo real depende do carregamento das fotos pelo proprietário antes da conexão de canal. | Aprovado com pendência operacional |
| Assunção pelo proprietário | Botão `Assumir conversa` com o comando `#assumir` no painel da conversa de teste. | O controle foi renderizado e o comando foi acionado. A sessão de navegador não possuía cookie de autenticação, como confirmado nos logs; por isso a confirmação manual do estado ficou bloqueada. A rota já possui cobertura automatizada de assunção com proprietário autorizado. | Aprovado por integração; validação manual requer sessão autenticada |

> Este registro cobre somente o simulador interno. Nenhuma conta Meta, número de WhatsApp ou canal Instagram foi ativado nesta rodada.
