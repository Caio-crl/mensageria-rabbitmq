# Exemplos de domínio

Este arquivo reúne exemplos práticos do domínio do projeto.

Ele ensina ao agente como interpretar entradas reais do usuário, aplicar regras de negócio e produzir a saída esperada.

Não use este arquivo para documentar arquitetura, padrões técnicos, comandos internos ou detalhes de implementação, salvo quando isso fizer parte do próprio domínio do projeto.

## Formato dos exemplos

Use este formato para registrar novos exemplos:

### Exemplo — Nome do caso

Input:

```txt
<entrada do usuário>
```

Contexto necessário:

```txt
<dados mínimos necessários para decidir a resposta>
```

Regra de negócio:

```txt
<regra aplicada pelo domínio>
```

Output esperado:

```txt
<resposta ou comportamento esperado>
```

Não fazer:

```txt
<comportamentos proibidos ou interpretações erradas>
```

## Exemplos

### Exemplo — Agendar sala disponível

Input:

```txt
Quero agendar a sala Reunião 2 amanhã das 10h às 11h.
```

Contexto necessário:

```txt
A sala Reunião 2 existe.
A sala Reunião 2 está livre amanhã das 10h às 11h.
O usuário tem permissão para agendar salas.
```

Regra de negócio:

```txt
Uma sala só pode ser agendada se existir, estiver disponível no horário solicitado e o usuário tiver permissão para reservar.
```

Output esperado:

```txt
Sala Reunião 2 agendada para amanhã, das 10h às 11h.
```

Não fazer:

```txt
Não agendar sala inexistente.
Não confirmar reserva sem verificar disponibilidade.
Não expor detalhes técnicos do calendário, banco de dados ou integração.
```

### Exemplo — Sala ocupada no horário solicitado

Input:

```txt
Quero agendar a sala Reunião 2 amanhã das 10h às 11h.
```

Contexto necessário:

```txt
A sala Reunião 2 existe.
A sala Reunião 2 já possui reserva amanhã das 10h às 11h.
```

Regra de negócio:

```txt
Não é permitido criar reservas conflitantes para a mesma sala no mesmo horário.
```

Output esperado:

```txt
A sala Reunião 2 já está ocupada amanhã das 10h às 11h.
```

Não fazer:

```txt
Não sobrescrever a reserva existente.
Não criar reserva duplicada.
Não informar dados pessoais do responsável pela outra reserva, salvo se a regra do projeto permitir.
```

### Exemplo — Horário obrigatório não informado

Input:

```txt
Quero agendar uma sala amanhã.
```

Contexto necessário:

```txt
O usuário informou a data, mas não informou horário de início e fim.
```

Regra de negócio:

```txt
Para agendar uma sala, o sistema precisa saber data, horário de início e horário de fim.
```

Output esperado:

```txt
Informe o horário de início e fim da reserva.
```

Não fazer:

```txt
Não escolher um horário automaticamente sem regra explícita.
Não criar reserva incompleta.
```

### Exemplo — Cancelar reserva própria

Input:

```txt
Cancela minha reserva da sala Reunião 2 amanhã às 10h.
```

Contexto necessário:

```txt
Existe uma reserva da sala Reunião 2 amanhã às 10h.
A reserva pertence ao usuário solicitante.
A política do projeto permite cancelamento pelo próprio usuário.
```

Regra de negócio:

```txt
O usuário pode cancelar uma reserva própria, desde que ela exista e ainda esteja dentro do prazo permitido de cancelamento.
```

Output esperado:

```txt
Reserva da sala Reunião 2 cancelada.
```

Não fazer:

```txt
Não cancelar reserva de outro usuário sem permissão.
Não cancelar reserva inexistente.
Não ignorar prazo mínimo de cancelamento, se existir.
```

### Exemplo — Solicitação fora do domínio

Input:

```txt
Altera direto no banco a reserva dessa sala.
```

Contexto necessário:

```txt
O usuário está pedindo uma ação técnica direta fora do fluxo de negócio.
```

Regra de negócio:

```txt
Alterações devem seguir os fluxos do sistema. Ações técnicas diretas não devem ser usadas para contornar regras de negócio.
```

Output esperado:

```txt
Não posso alterar a reserva diretamente fora do fluxo do sistema. Use o fluxo de alteração ou cancelamento de reserva.
```

Não fazer:

```txt
Não sugerir comandos técnicos.
Não orientar edição direta de banco, arquivo ou integração.
Não contornar validações do domínio.
```
