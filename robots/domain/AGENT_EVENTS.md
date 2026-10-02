# AGENT_EVENTS.md

Este arquivo é opcional e deve ser usado apenas se o projeto atual tiver eventos como parte relevante da arquitetura.

Exemplos de projetos em que este arquivo faz sentido:

- runtime observável;
- timeline de execução;
- event journal;
- auditoria;
- replay;
- status de agente;
- aprovações rastreáveis;
- integrações baseadas em eventos;
- streams para UI.

Se o projeto não for orientado a eventos, este arquivo pode ser removido ou ignorado.

## 1. Objetivo dos eventos

Eventos devem responder:

```txt
O que aconteceu?
Quando aconteceu?
Quem causou?
Qual recurso foi afetado?
Qual estado a UI ou o consumidor precisa entender?
O que precisa entrar no histórico?
```

Eventos não existem para despejar payload bruto. Eles devem carregar informação segura, mínima e útil.

## 2. Canal principal

Quando o projeto usar stream de eventos, prefira um canal principal e diferencie pelo campo `type`.

Exemplo:

```txt
channel: project.events
type: file.read
```

Evite criar canais demais quando a diferenciação por tipo for suficiente.

## 3. Envelope base sugerido

Adapte ao projeto, mas mantenha previsibilidade.

```ts
type ProjectEvent = {
  eventId: string;
  type: string;
  timestamp: string;
  actorId?: string;
  sessionId?: string;
  taskId?: string;
  resourceId?: string;
  payload: Record<string, unknown>;
};
```

Campos comuns:

- `eventId`: identificador único do evento;
- `type`: tipo semântico;
- `timestamp`: data/hora ISO;
- `actorId`: quem causou a ação, quando aplicável;
- `sessionId`: sessão relacionada, quando existir;
- `taskId`: tarefa relacionada, quando existir;
- `resourceId`: recurso principal afetado, quando existir;
- `payload`: dados específicos, mínimos e seguros.

## 4. Nome de eventos

Use nomes semânticos e estáveis.

Exemplos bons:

```txt
file.read
file.write.proposed
file.write.approved
file.write.applied
approval.required
approval.granted
approval.rejected
run.started
run.completed
run.failed
```

Exemplos ruins:

```txt
doThing
update
newEvent
step1
success
error
```

## 5. Payload seguro

Payload deve conter somente dados necessários para consumidores reais.

Pode conter:

- identificadores seguros;
- status;
- contadores;
- timestamps;
- nomes públicos de ações;
- resumos controlados;
- metadados mínimos.

Não deve conter:

- secrets;
- tokens;
- `.env`;
- certificados;
- chaves privadas;
- payload bruto;
- prompts privados;
- dados pessoais sem necessidade e base clara;
- stack traces crus;
- conteúdo completo de arquivos;
- resposta bruta de LLM;
- headers de autenticação.

## 6. Eventos e estado atual

Evento registra fato histórico. Estado atual geralmente deve ser derivado por projeção, agregação ou leitura específica.

Exemplo:

```txt
approval.required
approval.granted
```

Esses eventos contam uma história. Para saber o estado atual da aprovação, crie uma projeção ou agregação clara, em vez de fazer a UI interpretar payload bruto.

## 7. Eventos e UI

A UI não deve depender de eventos brutos quando existir uma projeção mais segura.

Prefira:

```txt
API/projeção -> modelo seguro -> componente
```

Evite:

```txt
evento bruto -> JSON na tela
```

## 8. Evolução de eventos

Ao criar ou alterar evento:

- documente o tipo;
- documente o payload;
- informe produtores;
- informe consumidores;
- mantenha compatibilidade quando possível;
- adicione testes de emissão/projeção quando aplicável;
- não remova campos usados sem migração;
- não adicione dados sensíveis para facilitar debug.

## 9. Checklist para novo evento

Antes de criar evento novo, responda:

```txt
Qual fato ele registra?
Quem consome?
Qual estado ele ajuda a derivar?
Qual payload mínimo é necessário?
Há risco de expor dado sensível?
Existe evento semelhante que pode ser reutilizado?
Precisa de documentação?
Precisa de teste?
```

Se não houver consumidor, auditoria ou necessidade clara, talvez o evento não deva existir.
