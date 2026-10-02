# UI_ENGINEERING_RULES.md

Este arquivo define regras reutilizáveis para desenvolvimento de UI/frontend. Ele vale para qualquer projeto que tenha interface, componentes, renderização, data fetching ou experiência de usuário.

## 1. Objetivo

UI boa deve ser:

- segura;
- legível;
- previsível;
- acessível;
- testável;
- simples de manter;
- conectada a contratos reais, não a mocks permanentes.

Não crie UI decorativa quando o problema pede fluxo, estado e clareza.

## 2. Segurança de renderização

- Renderize dados estruturados com componentes.
- Trate textos vindos de API, usuário, LLM, arquivo ou banco como texto puro.
- Não renderize HTML dinâmico.
- Não use `dangerouslySetInnerHTML`, salvo aprovação explícita.
- Não renderize Markdown vindo de fonte externa sem aprovação explícita.
- Se HTML/Markdown for aprovado, implemente sanitização explícita, allowlist e testes com conteúdo perigoso.
- Não renderize JSON cru em tela de produto.
- Não renderize payload bruto, logs brutos, prompts, respostas brutas de LLM, tokens, `.env`, `Authorization`, paths sensíveis, secrets ou stack traces crus.
- Renderize apenas campos necessários, seguros e intencionais.

## 3. Componentização

- Separe container/data-fetch de componente de apresentação.
- Container coordena consulta, ciclo de vida, estado e mapeamento seguro.
- Componente de apresentação recebe props explícitas e seguras.
- Quebre componentes grandes por responsabilidade real, não por estética.
- Prefira estado local quando o estado não precisa ser compartilhado.
- Evite store global sem necessidade.
- Não passe objeto bruto se o componente precisa de poucos campos.
- Helpers devem ser puros, pequenos e próximos do uso.
- Não esconda regra de segurança em helper genérico sem teste.

## 4. Tipos e contratos

- Tipos da UI devem representar o contrato consumido pela tela.
- Não aceite `any`, `unknown` ou payload genérico quando a tela usa campos específicos.
- Tipos compartilhados só devem existir quando houver uso real em mais de um ponto.
- Normalize dados de API antes de renderizar quando necessário.
- Não acople componente visual a resposta bruta de backend se a tela precisa apenas de projeção segura.

## 5. Data fetching

Toda tela com busca ou carregamento deve tratar explicitamente os estados aplicáveis:

- `idle`: nenhuma consulta iniciada;
- `loading`: consulta em andamento;
- `ready` ou `success`: dados renderizados;
- `empty`: consulta válida sem itens;
- `not_found`: recurso inexistente ou indisponível;
- `error`: falha segura e resumida.

Regras:

- Erro exibido ao usuário deve ser resumido e seguro.
- Não exponha erro bruto do backend.
- Não busque dado sensível que a tela não precisa.
- Não dependa de mock permanente quando existir API real no escopo.
- Não atualize estado com resposta obsoleta de consulta anterior.

## 6. Ciclo de vida

- Use dependências explícitas em efeitos.
- Cancele ou ignore respostas obsoletas quando a consulta mudar.
- Limpe timers, subscriptions e abort controllers.
- Não faça polling/streaming sem escopo aprovado.
- Não dispare fetch automático agressivo sem necessidade.
- Não use efeito para compensar modelagem ruim de estado.

## 7. Integração com APIs e proxy interno

- Chamadas do browser para backend interno, gateway, LLM, provider externo ou serviço privado devem passar por proxy interno da aplicação quando houver risco de expor URL, token ou detalhe privado.
- Prefira rotas relativas como `/service/*`.
- Não coloque URL privada, token ou segredo em bundle frontend.
- Variáveis públicas como `NEXT_PUBLIC_*` ou `VITE_*` não podem conter secrets ou URLs internas sensíveis.
- O proxy deve repassar apenas dados necessários e normalizar erros de forma segura.
- Exceções devem estar explícitas e aprovadas.

## 8. Layout

- Use layout simples e previsível.
- Prefira hierarquia visual clara, spacing consistente e densidade adequada ao contexto.
- Não crie dashboard grande quando um painel resolve.
- Evite elementos decorativos sem função.
- Evite nesting pesado de cards.
- A tela deve funcionar em viewport estreito sem sobreposição de texto/controles.
- UI interna também deve ser legível por humanos.

## 9. Acessibilidade mínima

- Use elementos semânticos quando possível.
- Inputs precisam de label acessível.
- Botões precisam de texto ou `aria-label` claro.
- Loading, erro e estado selecionado não devem depender apenas de cor.
- Não remova foco de teclado.
- Garanta contraste e texto legível.
- Não use ícone sem alternativa textual quando ele comunica ação ou estado.

## 10. Feedback e estados de ação

- Ação assíncrona deve ter feedback visível.
- Botão que dispara ação deve evitar duplo envio quando aplicável.
- Mensagem de sucesso deve informar o resultado real.
- Mensagem de erro deve informar o que o usuário pode fazer, sem vazar detalhe interno.
- Estados vazios devem orientar próximo passo quando fizer sentido.

## 11. Testes de UI

Teste comportamento, não decoração.

Cobrir quando aplicável:

- loading;
- ready/success;
- empty;
- not_found;
- error;
- ação principal;
- ausência de conteúdo sensível;
- texto de API renderizado como texto, não HTML;
- ausência de JSON cru/payload bruto/stack trace.

## 12. Proibições comuns

Não fazer sem aprovação explícita:

- raw/debug view;
- renderização de HTML/Markdown externo;
- exposição de payload completo;
- uso de mock permanente;
- redesign amplo;
- troca de biblioteca de UI;
- store global;
- polling/streaming;
- dependência nova de UI.
