# 🌤️ Previsão do Tempo

Aplicativo web de previsão do tempo que consome a API gratuita [Open-Meteo](https://open-meteo.com/). Exibe temperatura atual, sensação térmica, umidade, vento, máxima/mínima do dia e previsão para os próximos 7 dias — tudo com tema claro/escuro automático e fundo dinâmico por condição climática.

---

## 📋 Funcionalidades

- **Busca por cidade** com autocomplete (sugestões em tempo real)
- **Dados do clima atual**: temperatura, descrição, ícone animado, vento e umidade
- **Sensação térmica** calculada pelas fórmulas Heat Index (NOAA) e Wind Chill
- **Máxima e mínima do dia**
- **Previsão para os próximos 7 dias** com ícone, temperatura e descrição
- **Tema automático** claro/escuro baseado na hora local, com alternância manual
- **Fundo dinâmico** que muda conforme período do dia (dia/noite) e condição climática (limpo/nublado/chuva)
- **Cache de sessão** de 30 minutos para evitar requisições repetidas
- **Design responsivo** para desktop, tablet e smartphone

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 / CSS3 / JavaScript (ES6+) | Base da aplicação |
| [Open-Meteo API](https://open-meteo.com/) | Geocodificação e dados climáticos |
| [Weather Icons](https://erikflowers.github.io/weather-icons/) | Ícones meteorológicos |
| [Jest](https://jestjs.io/) | Testes automatizados |
| [JSDoc](https://jsdoc.app/) | Documentação do código |

---

## 📁 Estrutura do Projeto

```
projeto_clima/
├── assets/
│   ├── css/
│   │   └── style.css       # Estilos e temas
│   ├── js/
│   │   └── api.js          # Lógica principal e integração com APIs
│   └── img/
│       └── favicon.svg
├── tests/
│   └── api.test.js         # Testes automatizados (Jest)
├── index.html              # Interface da aplicação
├── package.json
└── README.md
```

---

## 🚀 Como executar

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- [Node.js](https://nodejs.org/) ≥ 14 (apenas para rodar os testes)

### Rodando a aplicação

Não é necessário servidor ou build. Basta abrir o arquivo diretamente no navegador:

```bash
# Opção 1 — abrir diretamente
open index.html

# Opção 2 — usar extensão Live Server no VS Code
# Clique com o botão direito em index.html → "Open with Live Server"
```

### Instalando dependências de teste

```bash
npm install
```

---

## 🧪 Testes

Os testes cobrem as funções principais do `api.js` utilizando mocks do `fetch`, sem realizar chamadas reais à API.

### Executar todos os testes

```bash
npm test
```

### Cobertura dos testes

| Categoria | Cenários testados |
|---|---|
| **Cidade válida** | Coordenadas, clima completo, previsão 7 dias, índice de umidade |
| **Cidade inválida** | `results` vazio, `null` ou `undefined` → `CIDADE_NAO_ENCONTRADA` |
| **Entrada vazia** | String vazia, espaços, `null`, `undefined`, tipo inválido |
| **Falha de API** | HTTP 500, HTTP 429, `current_weather` ausente, timeout de rede |
| **JSON inesperado** | `daily` ausente, `hourly` ausente, `current_weather` ausente |
| **Funções auxiliares** | Ícones dia/noite, código WMO inválido, formatação de data |

---

## 🌐 APIs utilizadas

### Open-Meteo Geocoding API
Converte nomes de cidades em coordenadas geográficas.
```
GET https://geocoding-api.open-meteo.com/v1/search?name={cidade}&count=1&language=pt
```

### Open-Meteo Weather API
Retorna clima atual e previsão dos próximos dias a partir de coordenadas.
```
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&daily=...
```

Ambas as APIs são **gratuitas** e **não exigem chave de acesso**.

---

## 🌡️ Cálculo da Sensação Térmica

A sensação térmica é calculada por dois métodos, dependendo da temperatura:

- **Heat Index (≥ 20°C)** — Fórmula de Rothfusz da NOAA, que considera temperatura e umidade relativa. Opera em °F internamente; a entrada é convertida de °C e o resultado convertido de volta.
- **Wind Chill (< 20°C com vento > 4,8 km/h)** — Considera temperatura e velocidade do vento.
- **Temperatura real** — Retornada quando não há dados de umidade disponíveis.

---

## 📝 Documentação do código

O arquivo `api.js` está documentado no padrão **JSDoc** com `@param`, `@returns`, `@throws` e `@example` em todas as funções e classes públicas.

Para gerar a documentação em HTML:

```bash
npx jsdoc assets/js/api.js -d docs/
```

---

## 🔄 Branches do projeto

| Branch | Conteúdo |
|---|---|
| `main` | Versão estável |
| `03_testes` | Configuração do Jest e testes automatizados |
| `04_doc_review` | JSDoc, revisão de código e README |

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais.