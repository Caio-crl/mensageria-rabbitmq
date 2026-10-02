# SECURITY_RULES.md

Este arquivo define regras de segurança para alterações neste repositório.

Ele complementa `robots/ENGINEERING_RULES.md` e deve ser seguido em qualquer mudança que envolva código, dados, configuração, API, UI, integração, autenticação, autorização, arquivos ou dependências.

## Princípios

- Segurança deve ser aplicada por padrão.
- Não deixe `TODO: secure later` ou equivalente.
- Prefira allow-list a block-list.
- Aplique menor privilégio.
- Não contorne regras de domínio, autenticação, autorização ou validação.
- Não exponha secrets, tokens, credenciais, cookies, dados pessoais, payload bruto, stack traces ou prompts privados.
- Não adicione superfícies de risco sem necessidade clara.

## TypeScript e contratos

- Use `strict` quando o projeto suportar.
- Evite `any`; prefira tipos específicos ou `unknown` com narrowing/type guards.
- Tipar entradas, saídas, configurações, tokens, claims, sessões, permissões e payloads externos.
- Não confie em tipos TypeScript para dados vindos de rede, arquivo, banco, ambiente, usuário ou integração.
- Valide em runtime dados não confiáveis antes de processar.

## Entrada, saída e parsing

- Valide inputs com Zod, Joi, JSON Schema ou mecanismo equivalente aprovado pelo projeto.
- Rejeite entradas inválidas com erro controlado.
- Defina limite de body/request compatível com cada endpoint.
- Use limites pequenos por padrão e aumente apenas com justificativa.
- Verifique `Content-Type` antes de fazer parsing quando o endpoint depender do formato do corpo.
- Escape ou sanitize dados conforme o destino: HTML, SQL, shell, path, URL, logs ou UI.
- Valide URLs para evitar SSRF, open redirect e acesso indevido a redes internas.
- Não aceite campos extras ou formatos alternativos sem necessidade explícita.

## Autenticação e autorização

- Use hash forte para senha, preferencialmente `argon2id`.
- Nunca armazene senha em texto puro.
- Valide tokens, issuer, audience, expiração, assinatura e permissões.
- Aplique RBAC, ABAC ou mecanismo equivalente quando houver controle de acesso.
- Nunca confie apenas no frontend para autorização.
- Verifique autorização no backend antes de operações de leitura sensível, escrita, exclusão, exportação ou ação administrativa.
- Bloqueie ou invalide credenciais comprometidas quando o fluxo do projeto exigir.

## Sessões, cookies e tokens

- Cookies sensíveis devem usar flags compatíveis com o contexto, como `HttpOnly`, `Secure` e `SameSite`.
- Tokens e sessões devem ter expiração adequada.
- Não logue tokens, cookies, refresh tokens, authorization headers ou session IDs.
- Modele claims e dados de sessão com tipos explícitos.
- Não coloque dados sensíveis desnecessários dentro de JWTs.

## Segredos e configuração

- Não leia, liste, imprima, copie, versione, resuma ou exponha arquivos sensíveis por padrão.
- Não versione segredos.
- Quando o projeto exigir segredo versionado, use mecanismo aprovado de criptografia de segredo, como SOPS ou equivalente.
- Valide variáveis de ambiente com dotenv-safe, Zod, env-var, config service ou mecanismo equivalente.
- Falhe cedo quando configuração obrigatória estiver ausente ou inválida.
- Não exiba valores de configuração sensível em logs, telas, erros ou artefatos.

## Node.js e APIs perigosas

- Importe módulos nativos usando `node:`.
- Não use `eval` ou `new Function`.
- Não execute código não confiável no mesmo processo.
- Não trate `node:vm` como sandbox de segurança.
- Para processos externos, prefira `execFile` ou `spawn` sem shell.
- Valide argumentos de processos filhos.
- Não construa comandos por concatenação de string com dados do usuário.
- Não modifique `globalThis`, prototypes nativos ou objetos globais.
- Use `Object.freeze`, `Object.seal` ou frozen intrinsics apenas quando o projeto suportar explicitamente e após validação, pois isso pode quebrar bibliotecas.

## HTTP e APIs públicas

- Use headers de segurança, como Helmet ou equivalente, quando aplicável.
- Aplique rate limiting em endpoints públicos, autenticação, busca, upload, exportação e operações caras.
- Proteja contra HTTP Parameter Pollution quando aplicável.
- Não exponha detalhes internos em mensagens de erro.
- Não retorne stack trace para usuário final.
- Use CORS restritivo e explícito quando o projeto expuser API para browsers.
- Exija HTTPS/TLS forte em ambientes reais.

## Arquivos e caminhos

- Normalize e valide caminhos antes de leitura ou escrita.
- Bloqueie path traversal.
- Restrinja leitura e escrita aos diretórios permitidos.
- Sanitize nomes de arquivos recebidos de usuário.
- Não processe arquivos sensíveis sem autorização explícita.
- Não confie em extensão de arquivo como prova de tipo seguro.
- Aplique limite de tamanho, tipo e quantidade em uploads quando aplicável.

## Banco de dados e consultas

- Use queries parametrizadas, query builders seguros ou ORM configurado corretamente.
- Não concatene SQL com dados do usuário.
- Valide filtros, ordenações e paginação recebidos externamente.
- Aplique limite de paginação para evitar abuso.
- Não retorne colunas sensíveis sem necessidade explícita.

## UI e renderização

- Não renderize HTML ou Markdown bruto sem sanitização e aprovação explícita.
- Não use `dangerouslySetInnerHTML` sem justificativa, sanitização e aprovação explícita.
- Não exponha payload bruto, secrets, stack traces ou dados pessoais na interface.
- Mensagens de erro devem ser úteis, mas não vazar implementação interna.
- Regras detalhadas de UI ficam em `robots/UI_ENGINEERING_RULES.md`.

## Dependências

- Use lockfile versionado.
- Evite dependências desnecessárias.
- Prefira bibliotecas mantidas, auditáveis, tipadas e com boa reputação.
- Execute auditoria de dependências quando aplicável.
- Não use `npm audit fix --force` automaticamente.
- Não introduza pacote para resolver problema simples sem avaliar risco, manutenção e superfície de ataque.
- Use imports de módulos nativos com `node:` para reduzir risco de typosquatting.

## Regex e negação de serviço

- Evite regex vulnerável a ReDoS.
- Limite tamanho de entrada antes de aplicar regex complexa.
- Evite processamento síncrono caro em entradas controladas por usuário.
- Para operações pesadas, considere timeout, fila, worker, streaming ou limite de concorrência.
- Monitore event loop ou saturação quando o projeto tiver risco real de sobrecarga.

## Erros, logs e observabilidade

- Trate erros de forma controlada.
- Não exponha stack traces ao usuário final.
- Logs devem ser estruturados quando aplicável.
- Não logue secrets, tokens, cookies, headers sensíveis, dados pessoais ou payloads brutos.
- Registre falhas não tratadas.
- Quando o estado da aplicação puder estar inconsistente, faça shutdown controlado e deixe o supervisor reiniciar.
- Métricas e alertas devem ser usados em fluxos críticos quando aplicável.

## Abuse prevention

- Aplique rate limiting onde houver risco de abuso.
- Considere backoff, lockout temporário, CAPTCHA ou verificação adicional apenas quando fizer sentido para o fluxo.
- Monitore tentativas repetidas de autenticação, enumeração, scraping, spam, upload abusivo e uso anormal de recursos.

## Threat modeling

Para mudanças sensíveis, registre riscos e mitigação quando aplicável:

- dados afetados;
- atores envolvidos;
- permissões necessárias;
- entradas não confiáveis;
- efeitos colaterais;
- falhas possíveis;
- mitigação adotada;
- validações executadas.

## Revisão de segurança antes de finalizar

Antes de concluir uma mudança, verifique:

- entradas externas foram validadas;
- autorização foi aplicada no backend;
- segredos não foram lidos ou expostos;
- erros não vazam implementação;
- logs não contêm dados sensíveis;
- dependências novas são necessárias e justificáveis;
- arquivos e caminhos foram restringidos;
- validações foram executadas e reportadas com resultado real.
