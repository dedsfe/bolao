# Bolão: Brasil X Escócia

## Palpites

### André

Brasil 2 X 0 Escócia

Goleadores:

- Brasil: Vini Jr, Endrick

### Gih

Brasil 3 X 1 Escócia

Goleadores:

- Brasil: Endrick, Neymar, Vini Jr
- Escócia: McTominay

### Kely

Brasil 2 X 0 Escócia

Goleadores:

- Brasil: Endrick, Vini Jr

### Kenia

Brasil 2 X 1 Escócia

Goleadores:

- Brasil: Endrick, Vini Jr
- Escócia: McTominay

### Junior

Brasil 2 X 0 Escócia

Goleadores:

- Brasil: Vini Jr, Endrick

### Sara

Brasil 2 X 1 Escócia

Goleadores:

- Brasil: Vini Jr, Santos
- Escócia: McTominay

### Keila

Brasil 2 X 1 Escócia

Goleadores:

- Brasil: Neymar, Vini Jr
- Escócia: McTominay

### Maria

Brasil 3 X 1 Escócia

Goleadores:

- Brasil: Neymar, Vini Jr, Neymar
- Escócia: McTominay

### Joao

Brasil 2 X 1 Escócia

Goleadores:

- Brasil: Vini Jr, Neymar
- Escócia: McTominay

### Luque

Brasil 4 X 1 Escócia

Goleadores:

- Brasil: Vini Jr, Vini Jr, Neymar, Endrick
- Escócia: McTominay

### Gabi

Brasil 2 X 1 Escócia

Goleadores:

- Brasil: Vini Jr, Endrick
- Escócia: McTominay

### Matheus

Brasil 4 X 0 Escócia

Goleadores:

- Brasil: Cunha, Cunha, Endrick, Vini Jr

## Sportmonks

Endpoint testado:

```text
https://api.sportmonks.com/v3/football/livescores/inplay?include=participants;scores;periods;events;league.country;round
```

Notas para integrar:

- O placar atual vem em `scores` com `description: "CURRENT"`.
- O lado do placar vem em `score.participant`: `home` ou `away`.
- Os times vêm em `participants`, usando `meta.location`: `home` ou `away`.
- Gols vêm em `events` com `type.code: "goal"` ou `type.developer_name: "GOAL"`.
- O tempo de jogo vem em `periods`, especialmente quando `ticking: true`.
