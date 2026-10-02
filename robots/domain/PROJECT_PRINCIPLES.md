# PROJECT_PRINCIPLES.md

Este arquivo descreve princípios, contexto, limites e decisões específicas do projeto atual.

Use este arquivo para explicar o sistema em que o agente está trabalhando agora. Não duplique aqui regras genéricas de engenharia, segurança ou UI. Essas regras ficam em `robots/ENGINEERING_RULES.md` e `robots/UI_ENGINEERING_RULES.md`.

## 1. Identificação do projeto

Preencha:

```txt
Nome do projeto: <nome>
Objetivo principal: <o que este sistema resolve>
Usuários principais: <quem usa>
Contexto de execução: <backend, frontend, CLI, app, worker, biblioteca, agente, etc.>
```

## 2. Objetivo do sistema

Explique em poucas linhas o que o sistema deve fazer e qual problema ele resolve.

Inclua:

- o resultado esperado para o usuário;
- o que o sistema deve priorizar;
- o que o sistema não tenta resolver.

## 3. Princípios específicos do projeto

Liste princípios que orientam decisões neste projeto.

Exemplos:

- O sistema deve priorizar segurança sobre automação completa.
- A UI deve mostrar estado real, não simular sucesso.
- Toda ação crítica precisa ser revisável.
- O histórico precisa permitir auditoria mínima.
- O sistema deve favorecer alterações pequenas e reversíveis.

## 4. Linguagem do domínio

Defina termos próprios deste projeto.

Formato sugerido:

```txt
Termo: <nome>
Significado: <definição>
Exemplo: <uso prático>
Não confundir com: <quando aplicável>
```

## 5. Fluxos principais

Descreva os fluxos que o agente precisa entender para trabalhar bem.

Formato sugerido:

```txt
Fluxo: <nome>
Entrada: <o que inicia o fluxo>
Passos principais: <resumo>
Saída esperada: <resultado>
Regras importantes: <limites e cuidados>
```

## 6. Arquitetura relevante

Explique apenas a arquitetura já existente ou aprovada que o agente precisa respeitar.

Inclua, se aplicável:

- módulos principais;
- fronteiras entre backend, frontend, worker, CLI ou pacotes;
- onde ficam contratos compartilhados;
- onde ficam testes;
- onde ficam docs;
- padrões locais já existentes.

Não use este arquivo para propor arquitetura nova. Registre somente o que existe ou o que já foi aprovado.

## 7. Limites do projeto

Declare o que não deve ser feito sem aprovação explícita.

Exemplos:

- não alterar autenticação;
- não mexer em persistência;
- não trocar biblioteca de UI;
- não adicionar dependência nova;
- não criar novo padrão global;
- não mudar contrato público;
- não alterar comportamento de produção sem teste.

## 8. Convenções locais

Registre convenções que só existem neste projeto.

Exemplos:

- nomes de pastas;
- nomes de endpoints;
- nomes de eventos;
- estilo de testes;
- formato de documentação;
- fluxo de checkpoint;
- comandos de validação esperados.

## 9. Validações esperadas

Liste validações comuns deste projeto.

Formato sugerido:

```txt
Cenário: <tipo de alteração>
Validações esperadas:
- <comando ou checagem>
- <teste específico>
- <build/type-check/lint quando aplicável>
```

## 10. Fora de escopo conhecido

Liste coisas que parecem tentadoras, mas não devem ser feitas automaticamente.

Exemplos:

- redesign de UI;
- troca de framework;
- refactor amplo;
- alteração de infraestrutura;
- automação destrutiva;
- leitura de dados sensíveis;
- criação de quality gate novo.
