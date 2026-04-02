/**
 * @fileoverview Módulo principal do aplicativo de previsão do tempo.
 * Gerencia requisições às APIs Open-Meteo (geocodificação e clima),
 * cache de sessão, temas, fundo dinâmico, autocomplete e renderização
 * dos dados climáticos no DOM.
 *
 * @author projeto_clima
 * @version 3.0.0
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
    0: { descricao: 'Céu limpo', iconeDia: 'wi-day-sunny', iconeNoite: 'wi-night-clear', categoria: 'limpo' },
    1: { descricao: 'Principalmente limpo', iconeDia: 'wi-day-sunny-overcast', iconeNoite: 'wi-night-alt-partly-cloudy', categoria: 'limpo' },
    2: { descricao: 'Parcialmente nublado', iconeDia: 'wi-day-cloudy', iconeNoite: 'wi-night-alt-cloudy', categoria: 'nublado' },
    3: { descricao: 'Nublado', iconeDia: 'wi-cloudy', iconeNoite: 'wi-cloudy', categoria: 'nublado' },
    45: { descricao: 'Neblina', iconeDia: 'wi-day-fog', iconeNoite: 'wi-night-fog', categoria: 'nublado' },
    48: { descricao: 'Nevoeiro com geada', iconeDia: 'wi-day-fog', iconeNoite: 'wi-night-fog', categoria: 'nublado' },
    51: { descricao: 'Garoa leve', iconeDia: 'wi-day-sprinkle', iconeNoite: 'wi-night-alt-sprinkle', categoria: 'chuva' },
    53: { descricao: 'Garoa moderada', iconeDia: 'wi-day-sprinkle', iconeNoite: 'wi-night-alt-sprinkle', categoria: 'chuva' },
    55: { descricao: 'Garoa intensa', iconeDia: 'wi-day-rain', iconeNoite: 'wi-night-alt-rain', categoria: 'chuva' },
    56: { descricao: 'Garoa congelante leve', iconeDia: 'wi-day-sleet', iconeNoite: 'wi-night-alt-sleet', categoria: 'chuva' },
    57: { descricao: 'Garoa congelante intensa', iconeDia: 'wi-day-sleet', iconeNoite: 'wi-night-alt-sleet', categoria: 'chuva' },
    61: { descricao: 'Chuva leve', iconeDia: 'wi-day-rain', iconeNoite: 'wi-night-alt-rain', categoria: 'chuva' },
    63: { descricao: 'Chuva moderada', iconeDia: 'wi-day-rain', iconeNoite: 'wi-night-alt-rain', categoria: 'chuva' },
    65: { descricao: 'Chuva intensa', iconeDia: 'wi-day-rain-wind', iconeNoite: 'wi-night-alt-rain-wind', categoria: 'chuva' },
    66: { descricao: 'Chuva congelante leve', iconeDia: 'wi-day-sleet', iconeNoite: 'wi-night-alt-sleet', categoria: 'chuva' },
    67: { descricao: 'Chuva congelante intensa', iconeDia: 'wi-day-sleet', iconeNoite: 'wi-night-alt-sleet', categoria: 'chuva' },
    71: { descricao: 'Neve leve', iconeDia: 'wi-day-snow', iconeNoite: 'wi-night-alt-snow', categoria: 'chuva' },
    73: { descricao: 'Neve moderada', iconeDia: 'wi-day-snow', iconeNoite: 'wi-night-alt-snow', categoria: 'chuva' },
    75: { descricao: 'Neve intensa', iconeDia: 'wi-day-snow-wind', iconeNoite: 'wi-night-alt-snow-wind', categoria: 'chuva' },
    77: { descricao: 'Granizo', iconeDia: 'wi-day-hail', iconeNoite: 'wi-night-alt-hail', categoria: 'chuva' },
    80: { descricao: 'Pancadas de chuva leves', iconeDia: 'wi-day-showers', iconeNoite: 'wi-night-alt-showers', categoria: 'chuva' },
    81: { descricao: 'Pancadas de chuva moderadas', iconeDia: 'wi-day-showers', iconeNoite: 'wi-night-alt-showers', categoria: 'chuva' },
    82: { descricao: 'Pancadas de chuva intensas', iconeDia: 'wi-day-storm-showers', iconeNoite: 'wi-night-alt-storm-showers', categoria: 'chuva' },
    85: { descricao: 'Pancadas de neve leves', iconeDia: 'wi-day-snow', iconeNoite: 'wi-night-alt-snow', categoria: 'chuva' },
    86: { descricao: 'Pancadas de neve intensas', iconeDia: 'wi-day-snow-wind', iconeNoite: 'wi-night-alt-snow-wind', categoria: 'chuva' },
    95: { descricao: 'Trovoada', iconeDia: 'wi-day-thunderstorm', iconeNoite: 'wi-night-alt-thunderstorm', categoria: 'chuva' },
    96: { descricao: 'Trovoada com granizo leve', iconeDia: 'wi-day-thunderstorm', iconeNoite: 'wi-night-alt-thunderstorm', categoria: 'chuva' },
    99: { descricao: 'Trovoada com granizo intenso', iconeDia: 'wi-day-storm-showers', iconeNoite: 'wi-night-alt-storm-showers', categoria: 'chuva' }
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
     * @param {string} chave - Chave de identificação do item.
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

    carregarPreferencia() {
        const temaSalvo = localStorage.getItem('tema-preferido');
        if (temaSalvo) {
            this.temaManual = temaSalvo;
            this.aplicarTema(temaSalvo);
        }
    }

    salvarPreferencia(tema) {
        this.temaManual = tema;
        localStorage.setItem('tema-preferido', tema);
    }

    aplicarTema(tema) {
        document.body.classList.toggle('tema-escuro', tema === 'escuro');
        this.atualizarIconeTema(tema);
    }

    atualizarIconeTema(tema) {
        const iconeTema = document.querySelector('.icone-tema');
        if (iconeTema) {
            iconeTema.className = tema === 'escuro'
                ? 'wi wi-night-clear icone-tema'
                : 'wi wi-day-sunny icone-tema';
        }
    }

    alternarTema() {
        const temaAtual = document.body.classList.contains('tema-escuro') ? 'escuro' : 'claro';
        const novoTema = temaAtual === 'escuro' ? 'claro' : 'escuro';
        this.aplicarTema(novoTema);
        this.salvarPreferencia(novoTema);
    }

    /**
     * Define o tema automaticamente com base na hora do dia,
     * somente se o usuário não tiver definido uma preferência manual.
     * @param {number} hora - Hora atual (0–23).
     */
    definirTemaAutomatico(hora) {
        if (this.temaManual) return;
        this.aplicarTema(hora >= 6 && hora < 18 ? 'claro' : 'escuro');
    }
}

const gerenciadorTema = new GerenciadorTema();

// ========== GERENCIADOR DE FUNDO DINÂMICO ==========

/**
 * Aplica o fundo visual dinâmico ao elemento `#fundoDinamico`.
 */
class GerenciadorFundo {
    /**
     * Define a classe CSS do fundo dinâmico conforme hora e condição climática.
     * @param {number} hora       - Hora atual (0–23).
     * @param {string} categoria  - Categoria climática ('limpo', 'nublado' ou 'chuva').
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
 * @param {string} dataString - String de data/hora no formato ISO 8601.
 * @returns {string} Data formatada, ex: 'quarta-feira, 1 de abril de 2026, 14h00'.
 */
function formatarDataHora(dataString) {
    const data = new Date(dataString);
    const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    const diaSemana = diasSemana[data.getDay()];
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    return `${diaSemana}, ${dia} de ${mes} de ${ano}, ${horas}h${minutos}`;
}

/**
 * Formata uma string de data (somente data, sem hora) para exibição na previsão semanal.
 * @param {string} dataString - Data no formato 'YYYY-MM-DD'.
 * @returns {{diaSemana: string, data: string}}
 */
function formatarDataPrevisao(dataString) {
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const diaSemana = diasSemana[data.getDay()];

    return {
        diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1, 3),
        data: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
    };
}

/**
 * Formata uma string de horário ISO retornada pela API (ex: '2026-04-01T06:23')
 * em formato legível HHhMM.
 * @param {string|null} isoString - String ISO 8601 ou null.
 * @returns {string} Horário formatado, ex: '06h23', ou 'N/D' se inválido.
 */
function formatarHorario(isoString) {
    if (!isoString) return 'N/D';
    try {
        const data = new Date(isoString);
        const h = String(data.getHours()).padStart(2, '0');
        const m = String(data.getMinutes()).padStart(2, '0');
        return `${h}h${m}`;
    } catch {
        return 'N/D';
    }
}

// ========== UTILITÁRIOS DE CLIMA ==========

/**
 * Retorna a descrição, ícone e categoria climática para um código WMO,
 * selecionando o ícone adequado para dia ou noite.
 * @param {number} codigoClima - Código WMO da condição climática.
 * @param {number} hora        - Hora atual (0–23).
 * @returns {{descricao: string, icone: string, categoria: string}}
 */
function obterInformacoesClima(codigoClima, hora) {
    const info = CODIGOS_CLIMA[codigoClima] || CODIGOS_CLIMA[0];
    const ehDia = hora >= 6 && hora < 18;
    return {
        descricao: info.descricao,
        icone: ehDia ? info.iconeDia : info.iconeNoite,
        categoria: info.categoria
    };
}

/**
 * Retorna a descrição, ícone diurno e categoria climática para uso na previsão semanal.
 * @param {number} codigoClima - Código WMO da condição climática.
 * @returns {{descricao: string, icone: string, categoria: string}}
 */
function obterInformacoesClimaPrevisao(codigoClima) {
    const info = CODIGOS_CLIMA[codigoClima] || CODIGOS_CLIMA[0];
    return {
        descricao: info.descricao,
        icone: info.iconeDia,
        categoria: info.categoria
    };
}

/**
 * Classifica o índice UV em nível textual e retorna uma classe CSS de cor.
 * @param {number|null} uv - Valor do índice UV (0–11+).
 * @returns {{nivel: string, classe: string}} Nível descritivo e classe CSS.
 * @example
 * classificarUV(3);  // { nivel: 'Moderado', classe: 'uv-moderado' }
 * classificarUV(10); // { nivel: 'Muito alto', classe: 'uv-muito-alto' }
 */
function classificarUV(uv) {
    if (uv === null || uv === undefined) return { nivel: 'N/D', classe: '' };
    if (uv <= 2) return { nivel: 'Baixo', classe: 'uv-baixo' };
    if (uv <= 5) return { nivel: 'Moderado', classe: 'uv-moderado' };
    if (uv <= 7) return { nivel: 'Alto', classe: 'uv-alto' };
    if (uv <= 10) return { nivel: 'Muito alto', classe: 'uv-muito-alto' };
    return { nivel: 'Extremo', classe: 'uv-extremo' };
}

// ========== CÁLCULO DE SENSAÇÃO TÉRMICA ==========

/**
 * Calcula a sensação térmica utilizando a fórmula de Rothfusz (Heat Index)
 * para temperaturas >= 20°C, ou Wind Chill para temperaturas abaixo de 20°C.
 * @param {number}      temperatura     - Temperatura atual em °C.
 * @param {number|null} umidade         - Umidade relativa em % (null retorna temperatura arredondada).
 * @param {number}      velocidadeVento - Velocidade do vento em km/h.
 * @returns {number} Sensação térmica arredondada em °C.
 */
function calcularSensacaoTermica(temperatura, umidade, velocidadeVento) {
    if (umidade === null || umidade === undefined) {
        return Math.round(temperatura);
    }

    const T = temperatura;
    const RH = umidade;

    if (T >= 20) {
        const TF = (T * 9 / 5) + 32;
        let hi = -42.379
            + 2.04901523 * TF
            + 10.14333127 * RH
            - 0.22475541 * TF * RH
            - 0.00683783 * TF * TF
            - 0.05481717 * RH * RH
            + 0.00122874 * TF * TF * RH
            + 0.00085282 * TF * RH * RH
            - 0.00000199 * TF * TF * RH * RH;

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
            + 0.6215 * T
            - 11.37 * Math.pow(velocidadeVento, 0.16)
            + 0.3965 * T * Math.pow(velocidadeVento, 0.16);
        return Math.round(windChill);
    }

    return Math.round(T);
}

// ========== API: BUSCAR COORDENADAS (AUTOCOMPLETE) ==========

/**
 * Busca até 10 cidades correspondentes ao termo informado (autocomplete).
 * @async
 * @param {string} nomeCidade - Termo de busca.
 * @returns {Promise<Array<{nome: string, estado: string, pais: string, latitude: number, longitude: number, displayName: string}>>}
 * @throws {Error} 'Erro ao buscar coordenadas' se a requisição HTTP falhar.
 */
async function buscarMultiplasCoordenadas(nomeCidade) {
    const url = `${CONFIG.URLS.GEOCODING}?name=${encodeURIComponent(nomeCidade)}&count=10&language=pt&format=json`;

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Erro ao buscar coordenadas');

    const dados = await resposta.json();
    if (!dados.results || dados.results.length === 0) return [];

    return dados.results.map(result => ({
        nome: result.name,
        estado: result.admin1 || '',
        pais: result.country || '',
        latitude: result.latitude,
        longitude: result.longitude,
        displayName: result.admin1
            ? `${result.name}, ${result.admin1}, ${result.country}`
            : `${result.name}, ${result.country}`
    }));
}

// ========== API: BUSCAR COORDENADAS (UMA ÚNICA) ==========

/**
 * Busca as coordenadas geográficas do primeiro resultado correspondente.
 * @async
 * @param {string} nomeCidade - Nome da cidade a localizar.
 * @returns {Promise<{nome: string, estado: string, pais: string, latitude: number, longitude: number}>}
 * @throws {Error} 'Erro ao buscar coordenadas' se a requisição HTTP falhar.
 * @throws {Error} 'CIDADE_NAO_ENCONTRADA' se nenhum resultado for retornado.
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
 * Busca os dados climáticos atuais e a previsão para os próximos 7 dias,
 * incluindo precipitação, nascer/pôr do sol e índice UV.
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
 *   probabilidadeChuva: number|null,
 *   nascerSol: string|null,
 *   porSol: string|null,
 *   indiceUV: number|null,
 *   previsaoSeteDias: Array<{data: string, codigoClima: number, temperaturaMax: number, temperaturaMin: number, probabilidadeChuva: number|null}>
 * }>}
 * @throws {Error} 'Erro ao buscar dados climáticos' se a requisição HTTP falhar.
 * @throws {Error} 'Dados climáticos indisponíveis' se `current_weather` estiver ausente.
 */
async function buscarClima(latitude, longitude) {
    const url = `${CONFIG.URLS.WEATHER}?latitude=${latitude}&longitude=${longitude}`
        + `&current_weather=true`
        + `&hourly=relative_humidity_2m`
        + `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max`
        + `&timezone=auto`
        + `&forecast_days=8`;

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Erro ao buscar dados climáticos');

    const dados = await resposta.json();
    if (!dados.current_weather) throw new Error('Dados climáticos indisponíveis');

    const { temperature: temperatura, windspeed: velocidadeVento, weathercode: codigoClima, time: horario } = dados.current_weather;

    // Umidade: busca índice exato no array hourly.time
    let umidade = null;
    if (dados.hourly?.relative_humidity_2m && dados.hourly?.time) {
        const indiceHora = dados.hourly.time.indexOf(horario);
        if (indiceHora !== -1) {
            umidade = dados.hourly.relative_humidity_2m[indiceHora];
        }
    }

    // Máx/mín do dia (índice 0 = hoje)
    const tempMaxDia = dados.daily?.temperature_2m_max?.[0] != null
        ? Math.round(dados.daily.temperature_2m_max[0])
        : null;
    const tempMinDia = dados.daily?.temperature_2m_min?.[0] != null
        ? Math.round(dados.daily.temperature_2m_min[0])
        : null;

    // Novos campos do dia atual
    const probabilidadeChuva = dados.daily?.precipitation_probability_max?.[0] ?? null;
    const nascerSol = dados.daily?.sunrise?.[0] ?? null;
    const porSol = dados.daily?.sunset?.[0] ?? null;
    const indiceUV = dados.daily?.uv_index_max?.[0] ?? null;

    const sensacaoTermica = calcularSensacaoTermica(temperatura, umidade, velocidadeVento);

    // Previsão dos próximos 7 dias
    const previsaoSeteDias = [];
    for (let i = 1; i <= 7; i++) {
        if (!dados.daily?.time?.[i]) break;
        previsaoSeteDias.push({
            data: dados.daily.time[i],
            codigoClima: dados.daily.weathercode[i],
            temperaturaMax: Math.round(dados.daily.temperature_2m_max[i]),
            temperaturaMin: Math.round(dados.daily.temperature_2m_min[i]),
            probabilidadeChuva: dados.daily?.precipitation_probability_max?.[i] ?? null
        });
    }

    return {
        temperatura,
        velocidadeVento,
        codigoClima,
        horario,
        umidade,
        sensacaoTermica,
        tempMaxDia,
        tempMinDia,
        probabilidadeChuva,
        nascerSol,
        porSol,
        indiceUV,
        previsaoSeteDias
    };
}

// ========== BUSCAR PREVISÃO COMPLETA (COM CACHE) ==========

/**
 * Orquestra a busca completa de previsão do tempo para uma cidade com cache.
 * @async
 * @param {string} nomeCidade - Nome da cidade a buscar.
 * @returns {Promise<Object>} Objeto combinado com coordenadas e dados climáticos.
 * @throws {Error} 'CIDADE_NAO_ENCONTRADA' se a cidade não for localizada.
 */
async function buscarPrevisaoCompleta(nomeCidade) {
    const chaveCache = nomeCidade.toLowerCase().trim();
    const dadosCache = cacheClima.obter(chaveCache);
    if (dadosCache) return dadosCache;

    const coordenadas = await buscarCoordenadas(nomeCidade);
    const clima = await buscarClima(coordenadas.latitude, coordenadas.longitude);

    const resultado = { ...coordenadas, ...clima };
    cacheClima.salvar(chaveCache, resultado);

    return resultado;
}

// ========== EXIBIR RESULTADOS ==========

/**
 * Renderiza todos os dados climáticos no DOM, incluindo os novos campos
 * de precipitação, nascer/pôr do sol e índice UV.
 * @param {Object} dados - Objeto com dados climáticos e de localização.
 */
function exibirResultados(dados) {
    const hora = new Date(dados.horario).getHours();
    const infoClima = obterInformacoesClima(dados.codigoClima, hora);

    document.getElementById('nomeCidade').textContent = dados.estado ? `${dados.nome}, ${dados.estado}` : `${dados.nome}, ${dados.pais}`;
    document.getElementById('temperatura').textContent = Math.round(dados.temperatura);
    document.getElementById('descricaoClima').textContent = infoClima.descricao;
    document.getElementById('velocidadeVento').textContent = `${dados.velocidadeVento} km/h`;
    document.getElementById('umidade').textContent = dados.umidade != null ? `${dados.umidade}%` : 'N/D';
    document.getElementById('dataHora').textContent = formatarDataHora(dados.horario);
    document.getElementById('iconeClima').className = `icone-clima wi ${infoClima.icone}`;
    document.getElementById('tempMaxDia').textContent = dados.tempMaxDia != null ? dados.tempMaxDia : '--';
    document.getElementById('tempMinDia').textContent = dados.tempMinDia != null ? dados.tempMinDia : '--';
    document.getElementById('sensacaoTermica').textContent = dados.sensacaoTermica != null ? `${dados.sensacaoTermica}°C` : 'N/D';

    // Probabilidade de chuva
    const elChuva = document.getElementById('probabilidadeChuva');
    if (elChuva) elChuva.textContent = dados.probabilidadeChuva != null ? `${dados.probabilidadeChuva}%` : 'N/D';

    // Nascer e pôr do sol
    const elNascer = document.getElementById('nascerSol');
    const elPor = document.getElementById('porSol');
    if (elNascer) elNascer.textContent = formatarHorario(dados.nascerSol);
    if (elPor) elPor.textContent = formatarHorario(dados.porSol);

    // Índice UV com classificação visual
    const elUV = document.getElementById('indiceUV');
    const elUVNivel = document.getElementById('indiceUVNivel');
    if (elUV) {
        const { nivel, classe } = classificarUV(dados.indiceUV);
        elUV.textContent = dados.indiceUV != null ? String(Math.round(dados.indiceUV)) : 'N/D';
        if (elUVNivel) {
            elUVNivel.textContent = nivel;
            elUVNivel.className = `uv-nivel ${classe}`;
        }
    }

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
 * Renderiza a lista de previsão para os próximos 7 dias no DOM,
 * incluindo probabilidade de chuva em cada dia.
 * @param {Array<{data: string, codigoClima: number, temperaturaMax: number, temperaturaMin: number, probabilidadeChuva: number|null}>} previsao
 */
function exibirPrevisaoSemanal(previsao) {
    const previsaoLista = document.getElementById('previsaoLista');
    const previsaoSemanal = document.getElementById('previsaoSemanal');

    if (!previsao || previsao.length === 0) {
        previsaoSemanal.classList.add('oculto');
        return;
    }

    previsaoSemanal.classList.remove('oculto');
    previsaoLista.innerHTML = '';

    previsao.forEach(dia => {
        const infoClima = obterInformacoesClimaPrevisao(dia.codigoClima);
        const dataFormatada = formatarDataPrevisao(dia.data);
        const chuvaStr = dia.probabilidadeChuva != null ? `${dia.probabilidadeChuva}%` : '--';

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
            <div class="previsao-chuva">
                <i class="wi wi-raindrop"></i>
                <span>${chuvaStr}</span>
            </div>
            <div class="previsao-descricao">${infoClima.descricao}</div>
        `;
        previsaoLista.appendChild(item);
    });
}

// ========== EXIBIR ERRO ==========

/**
 * Exibe a área de erro no DOM com a mensagem fornecida.
 * @param {string}  mensagem                - Texto de erro a exibir ao usuário.
 * @param {boolean} [permitirTentarNovamente=false] - Se `true`, exibe o botão "Tentar Novamente".
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
 * Remove a classe `oculto` de um elemento pelo seu ID.
 * @param {string} id - ID do elemento no DOM.
 */
function exibirElemento(id) {
    document.getElementById(id)?.classList.remove('oculto');
}

/**
 * Adiciona a classe `oculto` a um elemento pelo seu ID.
 * @param {string} id - ID do elemento no DOM.
 */
function ocultarElemento(id) {
    document.getElementById(id)?.classList.add('oculto');
}

// ========== AUTOCOMPLETE ==========

/** @type {Array<Object>} Lista das sugestões de cidades atualmente exibidas. */
let sugestoesAtuais = [];

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

function ocultarSugestoes() {
    const container = document.getElementById('autocompleteSugestoes');
    container.innerHTML = '';
    container.classList.add('oculto');
    sugestoesAtuais = [];
}

function selecionarSugestao(sugestao) {
    const campoCidade = document.getElementById('campoCidade');
    campoCidade.value = sugestao.estado
        ? `${sugestao.nome}, ${sugestao.estado}, ${sugestao.pais}`
        : `${sugestao.nome}, ${sugestao.pais}`;
    ocultarSugestoes();
    buscarClimaPorCoordenadas(sugestao.latitude, sugestao.longitude, sugestao.nome, sugestao.estado, sugestao.pais);
}

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

/** @type {{cancelada: boolean}|null} */
let buscaAtual = null;

async function processarBusca() {
    const campoCidade = document.getElementById('campoCidade');
    const nomeCidade = campoCidade.value.trim();

    if (!nomeCidade) {
        exibirErro('Por favor, digite o nome de uma cidade.');
        return;
    }

    ocultarSugestoes();
    if (buscaAtual) buscaAtual.cancelada = true;
    const busca = { cancelada: false };
    buscaAtual = busca;

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
 * Retorna uma versão com debounce da função fornecida.
 * @param {Function} funcao - Função a ser executada com debounce.
 * @param {number}   atraso - Tempo de espera em milissegundos.
 * @returns {Function}
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
    const campoCidade = document.getElementById('campoCidade');
    const botaoBusca = document.getElementById('botaoBusca');
    const botaoTema = document.getElementById('botaoTema');
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
        const hora = new Date(resultado.horario).getHours();
        const infoClima = obterInformacoesClima(resultado.codigoClima, hora);
        return {
            city: resultado.nome,
            temperature: resultado.temperatura,
            description: infoClima.descricao,
            windspeed: resultado.velocidadeVento,
            datetime: formatarDataHora(resultado.horario)
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
        formatarHorario,
        classificarUV,
        obterInformacoesClima,
        buscarMultiplasCoordenadas,
        exibirPrevisaoSemanal,
        getCoordinates: buscarCoordenadas,
        getWeather: buscarClima,
        searchWeather,
        getWeatherDescription,
        formatDateTime: () => formatarDataHora(new Date().toISOString()),
        validateCityInput
    };
}