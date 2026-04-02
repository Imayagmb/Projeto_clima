/**
 * @fileoverview Módulo principal do aplicativo de previsão do tempo.
 * Gerencia requisições às APIs Open-Meteo (geocodificação e clima),
 * cache de sessão, temas, fundo dinâmico, autocomplete e renderização
 * dos dados climáticos no DOM.
 *
 * @author projeto_clima
 * @version 2.0.0
 */

// ========== CONFIGURAÇÕES E CONSTANTES ==========

/**
 * Configurações globais da aplicação.
 * @constant {Object} CONFIG
 * @property {Object}  CONFIG.URLS              - URLs base das APIs externas.
 * @property {string}  CONFIG.URLS.GEOCODING    - Endpoint de geocodificação Open-Meteo.
 * @property {string}  CONFIG.URLS.WEATHER      - Endpoint de previsão do tempo Open-Meteo.
 * @property {number}  CONFIG.DEBOUNCE_DELAY    - Atraso em ms para o debounce do autocomplete.
 * @property {number}  CONFIG.CACHE_EXPIRATION  - Tempo de expiração do cache em ms (30 min).
 */
const CONFIG = {
    URLS: {
        GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
        WEATHER: 'https://api.open-meteo.com/v1/forecast'
    },
    DEBOUNCE_DELAY: 500,
    CACHE_EXPIRATION: 1800000
};

// ========== MAPEAMENTO DE CÓDIGOS METEOROLÓGICOS ==========

/**
 * Mapeamento dos códigos WMO de condição climática para descrições,
 * ícones Weather Icons e categoria visual.
 * @constant {Object.<number, {descricao: string, iconeDia: string, iconeNoite: string, categoria: string}>}
 */
const CODIGOS_CLIMA = {
    0:  { descricao: 'Céu limpo',                    iconeDia: 'wi-day-sunny',            iconeNoite: 'wi-night-clear',               categoria: 'limpo'   },
    1:  { descricao: 'Principalmente limpo',          iconeDia: 'wi-day-sunny-overcast',   iconeNoite: 'wi-night-alt-partly-cloudy',   categoria: 'limpo'   },
    2:  { descricao: 'Parcialmente nublado',          iconeDia: 'wi-day-cloudy',           iconeNoite: 'wi-night-alt-cloudy',          categoria: 'nublado' },
    3:  { descricao: 'Nublado',                       iconeDia: 'wi-cloudy',               iconeNoite: 'wi-cloudy',                    categoria: 'nublado' },
    45: { descricao: 'Neblina',                       iconeDia: 'wi-day-fog',              iconeNoite: 'wi-night-fog',                 categoria: 'nublado' },
    48: { descricao: 'Nevoeiro com geada',            iconeDia: 'wi-day-fog',              iconeNoite: 'wi-night-fog',                 categoria: 'nublado' },
    51: { descricao: 'Garoa leve',                    iconeDia: 'wi-day-sprinkle',         iconeNoite: 'wi-night-alt-sprinkle',        categoria: 'chuva'   },
    53: { descricao: 'Garoa moderada',                iconeDia: 'wi-day-sprinkle',         iconeNoite: 'wi-night-alt-sprinkle',        categoria: 'chuva'   },
    55: { descricao: 'Garoa intensa',                 iconeDia: 'wi-day-rain',             iconeNoite: 'wi-night-alt-rain',            categoria: 'chuva'   },
    56: { descricao: 'Garoa congelante leve',         iconeDia: 'wi-day-sleet',            iconeNoite: 'wi-night-alt-sleet',           categoria: 'chuva'   },
    57: { descricao: 'Garoa congelante intensa',      iconeDia: 'wi-day-sleet',            iconeNoite: 'wi-night-alt-sleet',           categoria: 'chuva'   },
    61: { descricao: 'Chuva leve',                    iconeDia: 'wi-day-rain',             iconeNoite: 'wi-night-alt-rain',            categoria: 'chuva'   },
    63: { descricao: 'Chuva moderada',                iconeDia: 'wi-day-rain',             iconeNoite: 'wi-night-alt-rain',            categoria: 'chuva'   },
    65: { descricao: 'Chuva intensa',                 iconeDia: 'wi-day-rain-wind',        iconeNoite: 'wi-night-alt-rain-wind',       categoria: 'chuva'   },
    66: { descricao: 'Chuva congelante leve',         iconeDia: 'wi-day-sleet',            iconeNoite: 'wi-night-alt-sleet',           categoria: 'chuva'   },
    67: { descricao: 'Chuva congelante intensa',      iconeDia: 'wi-day-sleet',            iconeNoite: 'wi-night-alt-sleet',           categoria: 'chuva'   },
    71: { descricao: 'Neve leve',                     iconeDia: 'wi-day-snow',             iconeNoite: 'wi-night-alt-snow',            categoria: 'chuva'   },
    73: { descricao: 'Neve moderada',                 iconeDia: 'wi-day-snow',             iconeNoite: 'wi-night-alt-snow',            categoria: 'chuva'   },
    75: { descricao: 'Neve intensa',                  iconeDia: 'wi-day-snow-wind',        iconeNoite: 'wi-night-alt-snow-wind',       categoria: 'chuva'   },
    77: { descricao: 'Granizo',                       iconeDia: 'wi-day-hail',             iconeNoite: 'wi-night-alt-hail',            categoria: 'chuva'   },
    80: { descricao: 'Pancadas de chuva leves',       iconeDia: 'wi-day-showers',          iconeNoite: 'wi-night-alt-showers',         categoria: 'chuva'   },
    81: { descricao: 'Pancadas de chuva moderadas',   iconeDia: 'wi-day-showers',          iconeNoite: 'wi-night-alt-showers',         categoria: 'chuva'   },
    82: { descricao: 'Pancadas de chuva intensas',    iconeDia: 'wi-day-storm-showers',    iconeNoite: 'wi-night-alt-storm-showers',   categoria: 'chuva'   },
    85: { descricao: 'Pancadas de neve leves',        iconeDia: 'wi-day-snow',             iconeNoite: 'wi-night-alt-snow',            categoria: 'chuva'   },
    86: { descricao: 'Pancadas de neve intensas',     iconeDia: 'wi-day-snow-wind',        iconeNoite: 'wi-night-alt-snow-wind',       categoria: 'chuva'   },
    95: { descricao: 'Trovoada',                      iconeDia: 'wi-day-thunderstorm',     iconeNoite: 'wi-night-alt-thunderstorm',    categoria: 'chuva'   },
    96: { descricao: 'Trovoada com granizo leve',     iconeDia: 'wi-day-thunderstorm',     iconeNoite: 'wi-night-alt-thunderstorm',    categoria: 'chuva'   },
    99: { descricao: 'Trovoada com granizo intenso',  iconeDia: 'wi-day-storm-showers',    iconeNoite: 'wi-night-alt-storm-showers',   categoria: 'chuva'   }
};

// ========== CACHE DE SESSÃO ==========

/**
 * Cache em memória para armazenar resultados de buscas climáticas,
 * evitando requisições repetidas à API dentro do período de expiração.
 */
class CacheClima {
    constructor() {
        /** @type {Map<string, {dados: Object, timestamp: number}>} */
        this.cache = new Map();
    }

    /**
     * Recupera um item do cache se ainda estiver válido.
     * @param {string} chave - Chave de identificação do item (nome da cidade em minúsculas).
     * @returns {Object|null} Dados armazenados ou `null` se ausente ou expirado.
     */
    obter(chave) {
        const item = this.cache.get(chave);
        if (!item) return null;

        if (Date.now() - item.timestamp > CONFIG.CACHE_EXPIRATION) {
            this.cache.delete(chave);
            return null;
        }

        return item.dados;
    }

    /**
     * Armazena um item no cache com timestamp atual.
     * @param {string} chave  - Chave de identificação.
     * @param {Object} dados  - Dados a serem armazenados.
     * @returns {void}
     */
    salvar(chave, dados) {
        this.cache.set(chave, { dados, timestamp: Date.now() });
    }

    /**
     * Remove todos os itens do cache.
     * @returns {void}
     */
    limpar() {
        this.cache.clear();
    }
}

const cacheClima = new CacheClima();

// ========== GERENCIADOR DE TEMAS ==========

/**
 * Gerencia a alternância entre tema claro e escuro,
 * persistindo a preferência do usuário no localStorage.
 */
class GerenciadorTema {
    constructor() {
        /** @type {string|null} Tema definido manualmente pelo usuário ('claro' | 'escuro' | null). */
        this.temaManual = null;
        this.carregarPreferencia();
    }

    /**
     * Carrega e aplica o tema salvo no localStorage, se existir.
     * @returns {void}
     */
    carregarPreferencia() {
        const temaSalvo = localStorage.getItem('tema-preferido');
        if (temaSalvo) {
            this.temaManual = temaSalvo;
            this.aplicarTema(temaSalvo);
        }
    }

    /**
     * Salva a preferência de tema no localStorage e atualiza o estado interno.
     * @param {string} tema - Tema a salvar ('claro' ou 'escuro').
     * @returns {void}
     */
    salvarPreferencia(tema) {
        this.temaManual = tema;
        localStorage.setItem('tema-preferido', tema);
    }

    /**
     * Aplica o tema ao `document.body` e atualiza o ícone do botão.
     * @param {string} tema - Tema a aplicar ('claro' ou 'escuro').
     * @returns {void}
     */
    aplicarTema(tema) {
        document.body.classList.toggle('tema-escuro', tema === 'escuro');
        this.atualizarIconeTema(tema);
    }

    /**
     * Atualiza a classe do ícone do botão de tema conforme o tema ativo.
     * @param {string} tema - Tema atual ('claro' ou 'escuro').
     * @returns {void}
     */
    atualizarIconeTema(tema) {
        const iconeTema = document.querySelector('.icone-tema');
        if (iconeTema) {
            iconeTema.className = tema === 'escuro'
                ? 'wi wi-night-clear icone-tema'
                : 'wi wi-day-sunny icone-tema';
        }
    }

    /**
     * Alterna entre tema claro e escuro, salvando a nova preferência.
     * @returns {void}
     */
    alternarTema() {
        const temaAtual = document.body.classList.contains('tema-escuro') ? 'escuro' : 'claro';
        const novoTema  = temaAtual === 'escuro' ? 'claro' : 'escuro';
        this.aplicarTema(novoTema);
        this.salvarPreferencia(novoTema);
    }

    /**
     * Define o tema automaticamente com base na hora do dia,
     * somente se o usuário não tiver definido uma preferência manual.
     * @param {number} hora - Hora atual (0–23).
     * @returns {void}
     */
    definirTemaAutomatico(hora) {
        if (this.temaManual) return;
        this.aplicarTema(hora >= 6 && hora < 18 ? 'claro' : 'escuro');
    }
}

const gerenciadorTema = new GerenciadorTema();

// ========== GERENCIADOR DE FUNDO DINÂMICO ==========

/**
 * Aplica o fundo visual dinâmico ao elemento `#fundoDinamico`
 * combinando período do dia e categoria climática.
 */
class GerenciadorFundo {
    /**
     * Define a classe CSS do fundo dinâmico conforme hora e condição climática.
     * @param {number} hora       - Hora atual (0–23).
     * @param {string} categoria  - Categoria climática ('limpo', 'nublado' ou 'chuva').
     * @returns {void}
     * @example
     * gerenciadorFundo.aplicarFundo(14, 'limpo'); // aplica 'dia-limpo'
     * gerenciadorFundo.aplicarFundo(21, 'chuva'); // aplica 'noite-chuva'
     */
    aplicarFundo(hora, categoria) {
        const fundoDinamico = document.getElementById('fundoDinamico');
        const periodo = hora >= 6 && hora < 18 ? 'dia' : 'noite';
        fundoDinamico.className = `fundo-dinamico ${periodo}-${categoria}`;
    }
}

const gerenciadorFundo = new GerenciadorFundo();

// ========== UTILITÁRIOS DE DATA ==========

/**
 * Formata uma string de data e hora no padrão legível em português.
 * @param {string} dataString - String de data/hora no formato ISO 8601 (ex: '2026-04-01T14:00').
 * @returns {string} Data formatada, ex: 'quarta-feira, 1 de abril de 2026, 14h00'.
 * @example
 * formatarDataHora('2026-04-01T14:00');
 * // Retorna: 'quarta-feira, 1 de abril de 2026, 14h00'
 */
function formatarDataHora(dataString) {
    const data = new Date(dataString);
    const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    const diaSemana = diasSemana[data.getDay()];
    const dia       = data.getDate();
    const mes       = meses[data.getMonth()];
    const ano       = data.getFullYear();
    const horas     = String(data.getHours()).padStart(2, '0');
    const minutos   = String(data.getMinutes()).padStart(2, '0');

    return `${diaSemana}, ${dia} de ${mes} de ${ano}, ${horas}h${minutos}`;
}

/**
 * Formata uma string de data (somente data, sem hora) para exibição
 * na previsão semanal, retornando dia da semana abreviado e data no formato DD/MM.
 * A data é interpretada como local para evitar deslocamentos de fuso horário.
 * @param {string} dataString - Data no formato 'YYYY-MM-DD'.
 * @returns {{diaSemana: string, data: string}} Objeto com dia abreviado e data formatada.
 * @example
 * formatarDataPrevisao('2026-04-02');
 * // Retorna: { diaSemana: 'Qu', data: '02/04' }
 */
function formatarDataPrevisao(dataString) {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const data       = new Date(ano, mes - 1, dia);
    const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const diaSemana  = diasSemana[data.getDay()];

    return {
        diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1, 3),
        data: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
    };
}

// ========== UTILITÁRIOS DE CLIMA ==========

/**
 * Retorna a descrição, ícone e categoria climática para um código WMO,
 * selecionando o ícone adequado para dia ou noite.
 * Código desconhecido retorna os dados do código 0 (céu limpo) como padrão.
 * @param {number} codigoClima - Código WMO da condição climática.
 * @param {number} hora        - Hora atual (0–23) para determinar ícone dia/noite.
 * @returns {{descricao: string, icone: string, categoria: string}} Informações do clima.
 * @example
 * obterInformacoesClima(3, 14);
 * // Retorna: { descricao: 'Nublado', icone: 'wi-cloudy', categoria: 'nublado' }
 */
function obterInformacoesClima(codigoClima, hora) {
    const info  = CODIGOS_CLIMA[codigoClima] || CODIGOS_CLIMA[0];
    const ehDia = hora >= 6 && hora < 18;

    return {
        descricao: info.descricao,
        icone:     ehDia ? info.iconeDia : info.iconeNoite,
        categoria: info.categoria
    };
}

/**
 * Retorna a descrição, ícone diurno e categoria climática para uso na
 * previsão semanal (sempre utiliza o ícone de dia).
 * @param {number} codigoClima - Código WMO da condição climática.
 * @returns {{descricao: string, icone: string, categoria: string}} Informações do clima.
 * @example
 * obterInformacoesClimaPrevisao(61);
 * // Retorna: { descricao: 'Chuva leve', icone: 'wi-day-rain', categoria: 'chuva' }
 */
function obterInformacoesClimaPrevisao(codigoClima) {
    const info = CODIGOS_CLIMA[codigoClima] || CODIGOS_CLIMA[0];
    return {
        descricao: info.descricao,
        icone:     info.iconeDia,
        categoria: info.categoria
    };
}

// ========== CÁLCULO DE SENSAÇÃO TÉRMICA ==========

/**
 * Calcula a sensação térmica utilizando a fórmula de Rothfusz (Heat Index)
 * para temperaturas >= 20°C, ou a fórmula de Wind Chill para temperaturas
 * abaixo de 20°C com vento significativo.
 *
 * A fórmula de Rothfusz opera originalmente em °F; a função converte
 * a entrada para °F e o resultado de volta para °C.
 *
 * @param {number}      temperatura     - Temperatura atual em °C.
 * @param {number|null} umidade         - Umidade relativa do ar em % (0–100).
 *                                        Se `null` ou `undefined`, retorna a temperatura arredondada.
 * @param {number}      velocidadeVento - Velocidade do vento em km/h.
 * @returns {number} Sensação térmica arredondada em °C.
 * @example
 * calcularSensacaoTermica(30, 80, 10); // Retorna valor de Heat Index em °C
 * calcularSensacaoTermica(10, 60, 20); // Retorna valor de Wind Chill em °C
 * calcularSensacaoTermica(22, null, 5); // Retorna 22
 */
function calcularSensacaoTermica(temperatura, umidade, velocidadeVento) {
    if (umidade === null || umidade === undefined) {
        return Math.round(temperatura);
    }

    const T  = temperatura;
    const RH = umidade;

    if (T >= 20) {
        const TF = (T * 9 / 5) + 32;

        let hi = -42.379
            + 2.04901523  * TF
            + 10.14333127 * RH
            - 0.22475541  * TF * RH
            - 0.00683783  * TF * TF
            - 0.05481717  * RH * RH
            + 0.00122874  * TF * TF * RH
            + 0.00085282  * TF * RH * RH
            - 0.00000199  * TF * TF * RH * RH;

        if (RH < 13 && TF >= 80 && TF <= 112) {
            hi -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(TF - 95)) / 17);
        } else if (RH > 85 && TF >= 80 && TF <= 87) {
            hi += ((RH - 85) / 10) * ((87 - TF) / 5);
        }

        const hiCelsius = (hi - 32) * 5 / 9;
        return Math.round(hiCelsius < T ? T : hiCelsius);
    }

    if (velocidadeVento > 4.8) {
        const windChill = 13.12
            + 0.6215  * T
            - 11.37   * Math.pow(velocidadeVento, 0.16)
            + 0.3965  * T * Math.pow(velocidadeVento, 0.16);
        return Math.round(windChill);
    }

    return Math.round(T);
}

// ========== API: BUSCAR COORDENADAS (AUTOCOMPLETE) ==========

/**
 * Busca até 10 cidades correspondentes ao termo informado na API de geocodificação
 * Open-Meteo, para uso no autocomplete do campo de busca.
 * @async
 * @param {string} nomeCidade - Termo de busca (nome parcial ou completo da cidade).
 * @returns {Promise<Array<{nome: string, estado: string, pais: string, latitude: number, longitude: number, displayName: string}>>}
 *   Lista de cidades encontradas, ou array vazio se nenhuma for encontrada.
 * @throws {Error} 'Erro ao buscar coordenadas' se a requisição HTTP falhar.
 * @example
 * const sugestoes = await buscarMultiplasCoordenadas('São');
 * // Retorna: [{ nome: 'São Paulo', estado: 'São Paulo', pais: 'Brazil', ... }, ...]
 */
async function buscarMultiplasCoordenadas(nomeCidade) {
    const url = `${CONFIG.URLS.GEOCODING}?name=${encodeURIComponent(nomeCidade)}&count=10&language=pt&format=json`;

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Erro ao buscar coordenadas');

    const dados = await resposta.json();
    if (!dados.results || dados.results.length === 0) return [];

    return dados.results.map(result => ({
        nome:        result.name,
        estado:      result.admin1 || '',
        pais:        result.country || '',
        latitude:    result.latitude,
        longitude:   result.longitude,
        displayName: result.admin1
            ? `${result.name}, ${result.admin1}, ${result.country}`
            : `${result.name}, ${result.country}`
    }));
}

// ========== API: BUSCAR COORDENADAS (UMA ÚNICA) ==========

/**
 * Busca as coordenadas geográficas do primeiro resultado correspondente
 * ao nome da cidade informado.
 * @async
 * @param {string} nomeCidade - Nome da cidade a localizar.
 * @returns {Promise<{nome: string, estado: string, pais: string, latitude: number, longitude: number}>}
 *   Dados de localização da cidade encontrada.
 * @throws {Error} 'Erro ao buscar coordenadas' se a requisição HTTP falhar.
 * @throws {Error} 'CIDADE_NAO_ENCONTRADA' se nenhum resultado for retornado pela API.
 * @example
 * const coords = await buscarCoordenadas('Curitiba');
 * // Retorna: { nome: 'Curitiba', estado: 'Paraná', pais: 'Brazil', latitude: -25.4284, longitude: -49.2733 }
 */
async function buscarCoordenadas(nomeCidade) {
    const url = `${CONFIG.URLS.GEOCODING}?name=${encodeURIComponent(nomeCidade)}&count=1&language=pt&format=json`;

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Erro ao buscar coordenadas');

    const dados = await resposta.json();
    if (!dados.results || dados.results.length === 0) throw new Error('CIDADE_NAO_ENCONTRADA');

    const { name, admin1, country, latitude, longitude } = dados.results[0];
    return { nome: name, estado: admin1 || '', pais: country || '', latitude, longitude };
}

// ========== API: BUSCAR CLIMA + PREVISÃO 7 DIAS ==========

/**
 * Busca os dados climáticos atuais e a previsão para os próximos 7 dias
 * para as coordenadas informadas, realizando uma única requisição à API.
 * Inclui temperatura, vento, umidade, sensação térmica, máxima/mínima do dia
 * e a previsão semanal.
 * @async
 * @param {number} latitude  - Latitude da localidade.
 * @param {number} longitude - Longitude da localidade.
 * @returns {Promise<{
 *   temperatura: number,
 *   velocidadeVento: number,
 *   codigoClima: number,
 *   horario: string,
 *   umidade: number|null,
 *   sensacaoTermica: number,
 *   tempMaxDia: number|null,
 *   tempMinDia: number|null,
 *   previsaoSeteDias: Array<{data: string, codigoClima: number, temperaturaMax: number, temperaturaMin: number}>
 * }>} Objeto com todos os dados climáticos.
 * @throws {Error} 'Erro ao buscar dados climáticos' se a requisição HTTP falhar.
 * @throws {Error} 'Dados climáticos indisponíveis' se `current_weather` estiver ausente na resposta.
 * @example
 * const clima = await buscarClima(-23.5505, -46.6333);
 * console.log(clima.temperatura);    // ex: 22.5
 * console.log(clima.tempMaxDia);     // ex: 28
 * console.log(clima.previsaoSeteDias.length); // 7
 */
async function buscarClima(latitude, longitude) {
    const url = `${CONFIG.URLS.WEATHER}?latitude=${latitude}&longitude=${longitude}`
        + `&current_weather=true`
        + `&hourly=relative_humidity_2m`
        + `&daily=weathercode,temperature_2m_max,temperature_2m_min`
        + `&timezone=auto`
        + `&forecast_days=8`;

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Erro ao buscar dados climáticos');

    const dados = await resposta.json();
    if (!dados.current_weather) throw new Error('Dados climáticos indisponíveis');

    const { temperature: temperatura, windspeed: velocidadeVento, weathercode: codigoClima, time: horario } = dados.current_weather;

    let umidade = null;
    if (dados.hourly?.relative_humidity_2m && dados.hourly?.time) {
        const indiceHora = dados.hourly.time.indexOf(horario);
        if (indiceHora !== -1) {
            umidade = dados.hourly.relative_humidity_2m[indiceHora];
        }
    }

    const tempMaxDia = dados.daily?.temperature_2m_max?.[0] != null
        ? Math.round(dados.daily.temperature_2m_max[0])
        : null;
    const tempMinDia = dados.daily?.temperature_2m_min?.[0] != null
        ? Math.round(dados.daily.temperature_2m_min[0])
        : null;

    const sensacaoTermica = calcularSensacaoTermica(temperatura, umidade, velocidadeVento);

    const previsaoSeteDias = [];
    for (let i = 1; i <= 7; i++) {
        if (!dados.daily?.time?.[i]) break;
        previsaoSeteDias.push({
            data:          dados.daily.time[i],
            codigoClima:   dados.daily.weathercode[i],
            temperaturaMax: Math.round(dados.daily.temperature_2m_max[i]),
            temperaturaMin: Math.round(dados.daily.temperature_2m_min[i])
        });
    }

    return { temperatura, velocidadeVento, codigoClima, horario, umidade, sensacaoTermica, tempMaxDia, tempMinDia, previsaoSeteDias };
}

// ========== BUSCAR PREVISÃO COMPLETA (COM CACHE) ==========

/**
 * Orquestra a busca completa de previsão do tempo para uma cidade:
 * verifica o cache, busca coordenadas e clima, e armazena o resultado.
 * @async
 * @param {string} nomeCidade - Nome da cidade a buscar.
 * @returns {Promise<Object>} Objeto combinado com coordenadas e dados climáticos completos.
 * @throws {Error} 'CIDADE_NAO_ENCONTRADA' se a cidade não for localizada.
 * @throws {Error} Erros de rede ou da API são propagados sem modificação.
 * @example
 * const dados = await buscarPrevisaoCompleta('Rio de Janeiro');
 * console.log(dados.nome);        // 'Rio de Janeiro'
 * console.log(dados.temperatura); // ex: 28
 */
async function buscarPrevisaoCompleta(nomeCidade) {
    const chaveCache = nomeCidade.toLowerCase().trim();
    const dadosCache = cacheClima.obter(chaveCache);
    if (dadosCache) return dadosCache;

    const coordenadas = await buscarCoordenadas(nomeCidade);
    const clima       = await buscarClima(coordenadas.latitude, coordenadas.longitude);

    const resultado = { ...coordenadas, ...clima };
    cacheClima.salvar(chaveCache, resultado);

    return resultado;
}

// ========== EXIBIR RESULTADOS ==========

/**
 * Renderiza todos os dados climáticos no DOM: cidade, temperatura,
 * descrição, vento, umidade, sensação térmica, máxima/mínima, data/hora,
 * ícone, previsão semanal, tema e fundo dinâmico.
 * @param {Object}        dados               - Objeto com dados climáticos e de localização.
 * @param {string}        dados.nome          - Nome da cidade.
 * @param {string}        [dados.estado]      - Estado/província (opcional).
 * @param {string}        dados.pais          - País.
 * @param {number}        dados.temperatura   - Temperatura atual em °C.
 * @param {number}        dados.codigoClima   - Código WMO da condição climática.
 * @param {string}        dados.horario       - Horário da medição (ISO 8601).
 * @param {number}        dados.velocidadeVento - Velocidade do vento em km/h.
 * @param {number|null}   dados.umidade       - Umidade relativa em %.
 * @param {number}        dados.sensacaoTermica - Sensação térmica em °C.
 * @param {number|null}   dados.tempMaxDia    - Temperatura máxima do dia em °C.
 * @param {number|null}   dados.tempMinDia    - Temperatura mínima do dia em °C.
 * @param {Array}         dados.previsaoSeteDias - Previsão dos próximos 7 dias.
 * @returns {void}
 */
function exibirResultados(dados) {
    const hora      = new Date(dados.horario).getHours();
    const infoClima = obterInformacoesClima(dados.codigoClima, hora);

    document.getElementById('nomeCidade').textContent       = dados.estado ? `${dados.nome}, ${dados.estado}` : `${dados.nome}, ${dados.pais}`;
    document.getElementById('temperatura').textContent      = Math.round(dados.temperatura);
    document.getElementById('descricaoClima').textContent   = infoClima.descricao;
    document.getElementById('velocidadeVento').textContent  = `${dados.velocidadeVento} km/h`;
    document.getElementById('umidade').textContent          = dados.umidade != null ? `${dados.umidade}%` : 'N/D';
    document.getElementById('dataHora').textContent         = formatarDataHora(dados.horario);
    document.getElementById('iconeClima').className         = `icone-clima wi ${infoClima.icone}`;
    document.getElementById('tempMaxDia').textContent       = dados.tempMaxDia  != null ? dados.tempMaxDia  : '--';
    document.getElementById('tempMinDia').textContent       = dados.tempMinDia  != null ? dados.tempMinDia  : '--';
    document.getElementById('sensacaoTermica').textContent  = dados.sensacaoTermica != null ? `${dados.sensacaoTermica}°C` : 'N/D';

    if (dados.previsaoSeteDias?.length > 0) {
        exibirPrevisaoSemanal(dados.previsaoSeteDias);
    }

    gerenciadorTema.definirTemaAutomatico(hora);
    gerenciadorFundo.aplicarFundo(hora, infoClima.categoria);

    ocultarElemento('indicadorCarregamento');
    ocultarElemento('areaErro');
    exibirElemento('areaResultados');
}

// ========== EXIBIR PREVISÃO SEMANAL ==========

/**
 * Renderiza a lista de previsão para os próximos 7 dias no DOM.
 * Exibe o bloco `#previsaoSemanal` se houver dados, ou o oculta caso contrário.
 * @param {Array<{data: string, codigoClima: number, temperaturaMax: number, temperaturaMin: number}>} previsao
 *   Array com os dados de cada dia da previsão.
 * @returns {void}
 */
function exibirPrevisaoSemanal(previsao) {
    const previsaoLista   = document.getElementById('previsaoLista');
    const previsaoSemanal = document.getElementById('previsaoSemanal');

    if (!previsao || previsao.length === 0) {
        previsaoSemanal.classList.add('oculto');
        return;
    }

    previsaoSemanal.classList.remove('oculto');
    previsaoLista.innerHTML = '';

    previsao.forEach(dia => {
        const infoClima     = obterInformacoesClimaPrevisao(dia.codigoClima);
        const dataFormatada = formatarDataPrevisao(dia.data);

        const item = document.createElement('div');
        item.className = 'previsao-item';
        item.innerHTML = `
            <div class="previsao-dia">
                <div class="dia-semana">${dataFormatada.diaSemana}</div>
                <div class="dia-data">${dataFormatada.data}</div>
            </div>
            <div class="previsao-icone">
                <i class="wi ${infoClima.icone}"></i>
            </div>
            <div class="previsao-temperaturas">
                <span class="previsao-max">${dia.temperaturaMax}°</span>
                <span class="previsao-min">${dia.temperaturaMin}°</span>
            </div>
            <div class="previsao-descricao">${infoClima.descricao}</div>
        `;
        previsaoLista.appendChild(item);
    });
}

// ========== EXIBIR ERRO ==========

/**
 * Exibe a área de erro no DOM com a mensagem fornecida,
 * ocultando os resultados e o indicador de carregamento.
 * @param {string}  mensagem                - Texto de erro a exibir ao usuário.
 * @param {boolean} [permitirTentarNovamente=false] - Se `true`, exibe o botão "Tentar Novamente".
 * @returns {void}
 */
function exibirErro(mensagem, permitirTentarNovamente = false) {
    document.getElementById('mensagemErro').textContent = mensagem;

    if (permitirTentarNovamente) {
        exibirElemento('botaoTentarNovamente');
    } else {
        ocultarElemento('botaoTentarNovamente');
    }

    ocultarElemento('indicadorCarregamento');
    ocultarElemento('areaResultados');
    exibirElemento('areaErro');
}

// ========== UTILITÁRIOS DE EXIBIÇÃO ==========

/**
 * Remove a classe `oculto` de um elemento pelo seu ID, tornando-o visível.
 * @param {string} id - ID do elemento no DOM.
 * @returns {void}
 */
function exibirElemento(id) {
    document.getElementById(id)?.classList.remove('oculto');
}

/**
 * Adiciona a classe `oculto` a um elemento pelo seu ID, ocultando-o.
 * @param {string} id - ID do elemento no DOM.
 * @returns {void}
 */
function ocultarElemento(id) {
    document.getElementById(id)?.classList.add('oculto');
}

// ========== AUTOCOMPLETE ==========

/** @type {Array<Object>} Lista das sugestões de cidades atualmente exibidas. */
let sugestoesAtuais = [];

/**
 * Busca sugestões de cidades para o termo informado e as exibe no autocomplete.
 * Oculta as sugestões se o termo tiver menos de 2 caracteres.
 * @async
 * @param {string} termo - Texto digitado pelo usuário no campo de busca.
 * @returns {Promise<void>}
 */
async function buscarSugestoes(termo) {
    if (!termo || termo.length < 2) {
        ocultarSugestoes();
        return;
    }

    try {
        sugestoesAtuais = await buscarMultiplasCoordenadas(termo);
        exibirSugestoes(sugestoesAtuais);
    } catch (erro) {
        console.error('Erro ao buscar sugestões:', erro);
        ocultarSugestoes();
    }
}

/**
 * Renderiza a lista de sugestões de cidades no dropdown de autocomplete.
 * Oculta o dropdown se a lista estiver vazia.
 * @param {Array<Object>} sugestoes - Lista de cidades retornada por `buscarMultiplasCoordenadas`.
 * @returns {void}
 */
function exibirSugestoes(sugestoes) {
    const container = document.getElementById('autocompleteSugestoes');

    if (!sugestoes || sugestoes.length === 0) {
        ocultarSugestoes();
        return;
    }

    container.innerHTML = '';

    sugestoes.forEach(sugestao => {
        const div = document.createElement('div');
        div.className = 'autocomplete-suggestion';
        div.innerHTML = `
            <i class="wi wi-location-arrow"></i>
            <div>
                <div class="sugestao-nome">${sugestao.nome}</div>
                <div class="sugestao-local">${sugestao.estado ? `${sugestao.estado}, ` : ''}${sugestao.pais}</div>
            </div>
        `;
        div.addEventListener('click', () => selecionarSugestao(sugestao));
        container.appendChild(div);
    });

    container.classList.remove('oculto');
}

/**
 * Oculta o dropdown de autocomplete e limpa a lista de sugestões.
 * @returns {void}
 */
function ocultarSugestoes() {
    const container = document.getElementById('autocompleteSugestoes');
    container.innerHTML = '';
    container.classList.add('oculto');
    sugestoesAtuais = [];
}

/**
 * Preenche o campo de busca com a cidade selecionada e inicia
 * a busca climática pelas coordenadas dessa cidade.
 * @param {Object} sugestao           - Objeto de cidade selecionada.
 * @param {string} sugestao.nome      - Nome da cidade.
 * @param {string} sugestao.estado    - Estado/província.
 * @param {string} sugestao.pais      - País.
 * @param {number} sugestao.latitude  - Latitude.
 * @param {number} sugestao.longitude - Longitude.
 * @returns {void}
 */
function selecionarSugestao(sugestao) {
    const campoCidade = document.getElementById('campoCidade');
    campoCidade.value = sugestao.estado
        ? `${sugestao.nome}, ${sugestao.estado}, ${sugestao.pais}`
        : `${sugestao.nome}, ${sugestao.pais}`;

    ocultarSugestoes();
    buscarClimaPorCoordenadas(sugestao.latitude, sugestao.longitude, sugestao.nome, sugestao.estado, sugestao.pais);
}

/**
 * Busca e exibe os dados climáticos diretamente pelas coordenadas,
 * sem passar pela etapa de geocodificação.
 * Usado ao selecionar uma sugestão do autocomplete.
 * @async
 * @param {number} latitude  - Latitude da cidade.
 * @param {number} longitude - Longitude da cidade.
 * @param {string} nome      - Nome da cidade.
 * @param {string} estado    - Estado/província.
 * @param {string} pais      - País.
 * @returns {Promise<void>}
 */
async function buscarClimaPorCoordenadas(latitude, longitude, nome, estado, pais) {
    ocultarElemento('areaErro');
    ocultarElemento('areaResultados');
    exibirElemento('indicadorCarregamento');

    try {
        const clima = await buscarClima(latitude, longitude);
        exibirResultados({ nome, estado, pais, latitude, longitude, ...clima });
    } catch (erro) {
        console.error('Erro ao buscar clima:', erro);
        exibirErro('Não foi possível obter os dados climáticos. Tente novamente mais tarde.', true);
    } finally {
        ocultarElemento('indicadorCarregamento');
    }
}

// ========== PROCESSAR BUSCA ==========

/** @type {{cancelada: boolean}|null} Referência à busca em andamento para controle de cancelamento. */
let buscaAtual = null;

/**
 * Lê o valor do campo de cidade, valida e inicia a busca climática completa.
 * Cancela buscas anteriores ainda em andamento. Exibe erros tratados ao usuário.
 * @async
 * @returns {Promise<void>}
 */
async function processarBusca() {
    const campoCidade = document.getElementById('campoCidade');
    const nomeCidade  = campoCidade.value.trim();

    if (!nomeCidade) {
        exibirErro('Por favor, digite o nome de uma cidade.');
        return;
    }

    ocultarSugestoes();

    if (buscaAtual) buscaAtual.cancelada = true;
    const busca = { cancelada: false };
    buscaAtual  = busca;

    ocultarElemento('areaErro');
    ocultarElemento('areaResultados');
    exibirElemento('indicadorCarregamento');

    try {
        const dados = await buscarPrevisaoCompleta(nomeCidade);
        if (busca.cancelada) return;
        exibirResultados(dados);
    } catch (erro) {
        if (busca.cancelada) return;

        if (erro.message === 'CIDADE_NAO_ENCONTRADA') {
            exibirErro(`Cidade "${nomeCidade}" não encontrada. Verifique o nome e tente novamente.`);
        } else if (erro.message.includes('Failed to fetch') || erro.message.includes('NetworkError')) {
            exibirErro('Erro de conexão. Verifique sua internet e tente novamente.', true);
        } else {
            exibirErro('Não foi possível obter os dados climáticos. Tente novamente mais tarde.', true);
        }
    } finally {
        if (buscaAtual === busca) buscaAtual = null;
    }
}

// ========== DEBOUNCE ==========

/**
 * Retorna uma versão com debounce da função fornecida,
 * adiando sua execução até que `atraso` ms tenham passado desde a última chamada.
 * @param {Function} funcao - Função a ser executada com debounce.
 * @param {number}   atraso - Tempo de espera em milissegundos.
 * @returns {Function} Nova função com debounce aplicado.
 * @example
 * const buscarDebounced = debounce(buscarSugestoes, 500);
 * input.addEventListener('input', e => buscarDebounced(e.target.value));
 */
function debounce(funcao, atraso) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => funcao.apply(this, args), atraso);
    };
}

// ========== INICIALIZAÇÃO ==========

document.addEventListener('DOMContentLoaded', () => {
    const campoCidade          = document.getElementById('campoCidade');
    const botaoBusca           = document.getElementById('botaoBusca');
    const botaoTema            = document.getElementById('botaoTema');
    const botaoTentarNovamente = document.getElementById('botaoTentarNovamente');

    botaoBusca.addEventListener('click', processarBusca);
    botaoTema.addEventListener('click', () => gerenciadorTema.alternarTema());
    botaoTentarNovamente.addEventListener('click', processarBusca);

    campoCidade.addEventListener('keypress', evento => {
        if (evento.key === 'Enter') {
            ocultarSugestoes();
            processarBusca();
        }
    });

    const buscarSugestoesDebounced = debounce(termo => buscarSugestoes(termo), CONFIG.DEBOUNCE_DELAY);
    campoCidade.addEventListener('input', evento => buscarSugestoesDebounced(evento.target.value.trim()));

    document.addEventListener('click', evento => {
        const wrapper = document.querySelector('.autocomplete-wrapper');
        if (wrapper && !wrapper.contains(evento.target)) ocultarSugestoes();
    });

    campoCidade.focus();
});

// ========== EXPORTAÇÕES PARA TESTES ==========
if (typeof module !== 'undefined' && module.exports) {
    const searchWeather = async (city) => {
        const resultado = await buscarPrevisaoCompleta(city);
        const hora      = new Date(resultado.horario).getHours();
        const infoClima = obterInformacoesClima(resultado.codigoClima, hora);
        return {
            city:        resultado.nome,
            temperature: resultado.temperatura,
            description: infoClima.descricao,
            windspeed:   resultado.velocidadeVento,
            datetime:    formatarDataHora(resultado.horario)
        };
    };

    const getWeatherDescription = (code, isDay) => {
        const info = obterInformacoesClima(code, isDay ? 12 : 0);
        return { description: info.descricao, icon: info.icone };
    };

    const validateCityInput = (input) => {
        if (!input || typeof input !== 'string' || input.trim() === '') {
            return { isValid: false, error: 'Por favor, digite o nome de uma cidade.' };
        }
        return { isValid: true };
    };

    module.exports = {
        buscarCoordenadas,
        buscarClima,
        buscarPrevisaoCompleta,
        exibirResultados,
        exibirErro,
        processarBusca,
        formatarDataHora,
        obterInformacoesClima,
        buscarMultiplasCoordenadas,
        exibirPrevisaoSemanal,
        getCoordinates:      buscarCoordenadas,
        getWeather:          buscarClima,
        searchWeather,
        getWeatherDescription,
        formatDateTime:      () => formatarDataHora(new Date().toISOString()),
        validateCityInput
    };
}