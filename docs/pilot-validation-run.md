# Rodada Autônoma de Validação — Piloto Duconde

**Data:** 19 de agosto de 2026  
**Ambiente:** Simulador interno da CECRETAR.IA e suíte Vitest

## Escopo executado

| Cenário | Mensagem simulada | Critério de aceite | Resultado |
|---|---|---|---|
| Preço e capacidade | “Quanto custa uma sala para quatro pessoas?” | Informar R$ 1.500 e não prometer disponibilidade | Aprovado |
| Localização | “Onde fica o Duconde?” | Informar Rua Conde de Irajá, 910, Torre e CEP 50610-100 | Aprovado |
| Mídia | “Quero ver fotos das salas” | Associar a intenção de mídia sem alegar envio inexistente | Corrigido e aprovado |
| Qualificação | “Meu nome é Ana, moro em Recife e preciso de uma sala para três pessoas.” | Extrair nome, cidade e necessidade | Aprovado |
| Transferência humana | “Quero falar com gente” | Transferir imediatamente e registrar o evento | Aprovado |
| Agendamento | “Quero agendar uma visita na sexta-feira à tarde.” | Orientar o próximo passo sem confirmar reserva | Aprovado |
| Caixa de entrada | Assumir conversa manualmente | Alterar o status para humano e manter uma nota de sistema | Aprovado |
| Agenda manual | Criar, remarcar e cancelar visita | Manter histórico por status, sem excluir o registro | Aprovado |

## Falha encontrada e correção

| Item | Achado | Correção aplicada |
|---|---|---|
| Linguagem de mídia | A resposta de fotos afirmava “Separei as imagens”, o que poderia sugerir entrega de mídia mesmo sem arquivo configurado | A resposta foi substituída por texto neutro; o envio real depende de mídia cadastrada na biblioteca |

## Evidência de execução

A matriz automatizada foi executada duas vezes de forma consecutiva antes da correção de cobertura operacional, e depois novamente com os fluxos de caixa de entrada e agenda incluídos. A última execução concluiu com **6 arquivos de teste e 20 testes aprovados**. A compilação de produção também foi concluída com sucesso.

## Pendências humanas

O piloto ainda precisa de validação subjetiva do usuário para tom de voz, adequação comercial e conteúdo audiovisual real. A conexão do número de teste na Cloud API e a integração Google Calendar real permanecem deliberadamente desativadas até a aprovação do piloto interno.
