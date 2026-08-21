# Runtime QA — 21 de agosto de 2026

Após reinício limpo do servidor de desenvolvimento, foram verificados no navegador os módulos de canal e horários.

| Módulo | Evidência | Resultado |
|---|---|---|
| Canal WhatsApp e Instagram | Rota `/?section=canal` carregou com configuração por especialista, rascunhos e indicadores de prontidão Meta. | Carregamento sem erro de runtime atual. |
| Horários | Rota `/?section=horarios` carregou cinco dias úteis, campos de início/fim, intervalo, estado ativo e botão de salvamento. | Carregamento sem duplicidade de dias nem erro de runtime atual. |
| HTTP do painel | As rotas raiz, simulador, canais e horários retornaram HTTP 200 no servidor local. | Aprovado. |
| Logs pós-reinício | Nenhum erro novo de console foi encontrado; a ocorrência de export vista no arquivo histórico tinha marca de tempo de 19 de agosto e não reapareceu após o reinício de 21 de agosto. | Aprovado. |

O teste de captura automática retornou falhas de upload de captura em algumas rotas, sem indicar falha do aplicativo. A navegação direta no navegador carregou os módulos normalmente.

## Verificação adicional após rotação de logs

Após rotacionar os logs às 00:15:57 UTC e reiniciar o servidor, a navegação direta carregou com sucesso:

| Rota | Módulos verificados | Resultado |
|---|---|---|
| `/?section=canal` | WhatsApp Cloud API e Instagram Direct por especialista, campos de rascunho e prontidão Meta. | Carregamento bem-sucedido. |
| `/?section=agenda` | Novo agendamento, agenda isolada por especialista e aviso de conexão futura com Google Calendar. | Carregamento bem-sucedido. |

O navegador não reportou erro de console após essa rotação. O servidor retornou HTTP 200 para as rotas verificadas.
