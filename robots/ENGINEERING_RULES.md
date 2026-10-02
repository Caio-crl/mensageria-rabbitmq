# ENGINEERING_RULES.md

Este arquivo define regras gerais de engenharia para alterações neste repositório.

Ele deve ser lido antes de planejar ou implementar qualquer mudança.

## Princípios gerais

- Entenda o escopo antes de alterar código.
- Prefira soluções simples, locais e explícitas.
- Não crie arquitetura, abstração, framework interno, quality gate ou padrão global sem necessidade real e aprovação explícita.
- Não altere arquivos fora do escopo aprovado.
- Não misture implementação, refatoração, mudança visual e melhoria oportunista na mesma tarefa sem autorização.
- Preserve comportamento existente salvo quando a mudança solicitada exigir o contrário.
- Quando houver dúvida relevante, pergunte antes de modificar.

## TypeScript e tipos

- Use TypeScript com `strict` habilitado quando o projeto suportar.
- Evite `any`; prefira tipos específicos ou `unknown` com narrowing/type guards.
- Tipar entradas, saídas, payloads, configurações, retornos assíncronos e contratos externos.
- Não confie apenas em tipos TypeScript para dados vindos de usuário, rede, arquivo, banco, ambiente ou integrações; valide em runtime quando necessário.
- Use interfaces e types para estruturas relevantes, evitando objetos soltos difíceis de auditar.
- Use modificadores de acesso (`public`, `private`, `protected`) quando eles ajudarem a expressar encapsulamento.
- Use `readonly` e imutabilidade quando isso reduzir efeitos colaterais e tornar o fluxo mais previsível.

## Design de código

- Mantenha baixa complexidade ciclomática e cognitiva.
- Divida lógica complexa em funções pequenas, nomeadas e testáveis.
- Use nomes claros para variáveis, funções, classes, tipos, módulos e arquivos.
- Siga responsabilidade única: cada módulo, classe ou função deve ter um motivo claro para mudar.
- Prefira alta coesão e baixo acoplamento.
- Evite duplicação, mas não extraia abstrações cedo demais.
- Duplicação pequena e local pode ser melhor que abstração genérica prematura.
- Não crie helpers genéricos se o caso de uso ainda não se repetiu de forma clara.

## Estrutura e organização

- Respeite a estrutura existente do projeto.
- Coloque arquivos novos próximos do domínio funcional que eles atendem.
- Não reorganize pastas sem aprovação explícita.
- Mantenha nomes de arquivos consistentes com o padrão do repositório.
- Separe código de domínio, infraestrutura, validação, apresentação e testes quando o projeto já seguir essa separação.
- Evite dependências circulares.

## Fluxo assíncrono

- Prefira `async`/`await` ou cadeias de Promises claras.
- Tipar retornos assíncronos como `Promise<T>` quando isso aumentar clareza.
- Não bloqueie o event loop com tarefas pesadas.
- Para processamento caro, considere worker, fila, batch, streaming, limite de concorrência ou outra estratégia compatível com o projeto.
- Sempre trate erros assíncronos de forma explícita.

## Testes e validações

- Adicione ou atualize testes compatíveis com o risco da mudança.
- Cubra comportamento feliz, erro relevante e bordas do domínio quando aplicável.
- Não remova testes para fazer a suíte passar.
- Não reduza cobertura de comportamento sem explicar e obter aprovação.
- Execute validações compatíveis com o escopo e reporte o resultado real.
- Não afirme que uma validação passou se ela não foi executada.

## Documentação

- Documente decisões relevantes, contratos e comportamentos não óbvios.
- Use TSDoc ou comentários quando a intenção não for evidente pelo código.
- Não comente o óbvio.
- Atualize documentação quando alterar comportamento público, fluxo de domínio, contrato de API, evento, configuração ou regra operacional.
- Registre limitações e pendências reais, sem criar ruído.

## Dependências

- Evite adicionar dependências sem necessidade clara.
- Prefira bibliotecas mantidas, auditáveis, tipadas e compatíveis com a stack do projeto.
- Use lockfile versionado.
- Não atualize dependências em massa sem escopo explícito.
- Não use comandos de correção automática agressiva, como `npm audit fix --force`, sem aprovação explícita.

## Segurança

Leia e siga `robots/SECURITY_RULES.md`.

Código simples, tipado e testável ajuda segurança, mas não substitui:

- validação de entradas;
- autorização adequada;
- proteção de segredos;
- tratamento seguro de erros;
- controle de dependências;
- proteção contra APIs perigosas;
- tratamento seguro de arquivos, caminhos e saídas.

## Arquivos sensíveis

Por padrão, não leia, liste, imprima, copie, versione, resuma ou exponha arquivos sensíveis.

Considere sensíveis, entre outros:

- `.env`, `.env.*`, `.env.local`;
- certificados, chaves privadas e arquivos em `cert/`;
- arquivos `.key`, `.pem`, `.crt`, `.pfx`, `.p12`;
- secrets, tokens, credenciais e dumps;
- arquivos com dados pessoais ou informações privadas.

Exceções exigem solicitação explícita do usuário e necessidade técnica clara. Mesmo assim, não imprima nem exponha o conteúdo sensível.

## Finalização

Ao terminar uma alteração, informe somente:

- resumo objetivo do que foi feito;
- arquivos alterados;
- validações executadas e resultado real;
- pendências ou limitações reais.

Não inclua logs extensos, justificativas desnecessárias ou progresso irrelevante.
