// ========== CONFIGURAÇÕES E CONSTANTES ==========
const CONFIG = {
    URLS: {
        GEOCODING: 'https://geocoding-api.open-meteo.com/v1/search',
        WEATHER: 'https://api.open-meteo.com/v1/forecast'
    },
    DEBOUNCE_DELAY: 500,
    CACHE_EXPIRATION: 1800000
};

// ========== MAPEAMENTO DE CÓDIGOS METEOROLÓGICOS ==========
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
class CacheClima {
    constructor() {
        this.cache = new Map();
    }

    obter(chave) {
        const item = this.cache.get(chave);
        if (!item) return null;

        if (Date.now() - item.timestamp > CONFIG.CACHE_EXPIRATION) {
            this.cache.delete(chave);
            return null;
        }

        return item.dados;
    }

    salvar(chave, dados) {
        this.cache.set(chave, { dados, timestamp: Date.now() });
    }

    limpar() {
        this.cache.clear();
    }
}

const cacheClima = new CacheClima();

// ========== GERENCIADOR DE TEMAS ==========
class GerenciadorTema {
    constructor() {
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

    definirTemaAutomatico(hora) {
        if (this.temaManual) return;
        this.aplicarTema(hora >= 6 && hora < 18 ? 'claro' : 'escuro');
    }
}

const gerenciadorTema = new GerenciadorTema();

// ========== GERENCIADOR DE FUNDO DINÂMICO ==========
class GerenciadorFundo {
    aplicarFundo(hora, categoria) {
        const fundoDinamico = document.getElementById('fundoDinamico');
        const periodo = hora >= 6 && hora < 18 ? 'dia' : 'noite';
        fundoDinamico.className = `fundo-dinamico ${periodo}-${categoria}`;
    }
}

const gerenciadorFundo = new GerenciadorFundo();

// ========== UTILITÁRIOS DE DATA ==========
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

function formatarDataPrevisao(dataString) {
    // Interpreta a data como local para evitar deslocamento de fuso
    const [ano, mes, dia] = dataString.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const diaSemana = diasSemana[data.getDay()];

    return {
        diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1, 3),
        data: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
    };
}

// ========== UTILITÁRIOS DE CLIMA ==========
function obterInformacoesClima(codigoClima, hora) {
    const info = CODIGOS_CLIMA[codigoClima] || CODIGOS_CLIMA[0];
    const ehDia = hora >= 6 && hora < 18;

    return {
        descricao: info.descricao,
        icone: ehDia ? info.iconeDia : info.iconeNoite,
        categoria: info.categoria
    };
}

function obterInformacoesClimaPrevisao(codigoClima) {
    const info = CODIGOS_CLIMA[codigoClima] || CODIGOS_CLIMA[0];
    return {
        descricao: info.descricao,
        icone: info.iconeDia,
        categoria: info.categoria
    };
}

// ========== CÁLCULO DE SENSAÇÃO TÉRMICA ==========
// Fórmula de Rothfusz opera em °F — converte entrada e saída 
function calcularSensacaoTermica(temperatura, umidade, velocidadeVento) {
    if (umidade === null || umidade === undefined) {
        return Math.round(temperatura);
    }

    const T = temperatura;
    const RH = umidade;

    // Heat Index (para temperaturas >= 20°C)
    if (T >= 20) {
        const TF = (T * 9 / 5) + 32; // Converte para °F (fórmula exige °F)

        let hi = -42.379
            + 2.04901523  * TF
            + 10.14333127 * RH
            - 0.22475541  * TF * RH
            - 0.00683783  * TF * TF
            - 0.05481717  * RH * RH
            + 0.00122874  * TF * TF * RH
            + 0.00085282  * TF * RH * RH
            - 0.00000199  * TF * TF * RH * RH;

        // Ajuste para umidade baixa
        if (RH < 13 && TF >= 80 && TF <= 112) {
            hi -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(TF - 95)) / 17);
        }
        // Ajuste para umidade alta
        else if (RH > 85 && TF >= 80 && TF <= 87) {
            hi += ((RH - 85) / 10) * ((87 - TF) / 5);
        }

        const hiCelsius = (hi - 32) * 5 / 9; // Converte resultado de volta para °C
        return Math.round(hiCelsius < T ? T : hiCelsius);
    }

    // Wind Chill (para temperaturas < 20°C com vento significativo)
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
// Índice de umidade calculado a partir do array hourly.time, não da hora local
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

    // busca o índice exato da hora atual no array hourly.time
    let umidade = null;
    if (dados.hourly?.relative_humidity_2m && dados.hourly?.time) {
        const indiceHora = dados.hourly.time.indexOf(horario);
        if (indiceHora !== -1) {
            umidade = dados.hourly.relative_humidity_2m[indiceHora];
        }
    }

    // Temperatura máxima e mínima do dia atual (índice 0 = hoje)
    const tempMaxDia = dados.daily?.temperature_2m_max?.[0] != null
        ? Math.round(dados.daily.temperature_2m_max[0])
        : null;
    const tempMinDia = dados.daily?.temperature_2m_min?.[0] != null
        ? Math.round(dados.daily.temperature_2m_min[0])
        : null;

    // sensação térmica 
    const sensacaoTermica = calcularSensacaoTermica(temperatura, umidade, velocidadeVento);

    // previsão dos próximos 7 dias montada aqui
    const previsaoSeteDias = [];
    for (let i = 1; i <= 7; i++) {
        if (!dados.daily?.time?.[i]) break;
        previsaoSeteDias.push({
            data: dados.daily.time[i],
            codigoClima: dados.daily.weathercode[i],
            temperaturaMax: Math.round(dados.daily.temperature_2m_max[i]),
            temperaturaMin: Math.round(dados.daily.temperature_2m_min[i])
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
        previsaoSeteDias
    };
}

// ========== BUSCAR PREVISÃO COMPLETA (COM CACHE) ==========
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
function exibirResultados(dados) {
    const hora = new Date(dados.horario).getHours();
    const infoClima = obterInformacoesClima(dados.codigoClima, hora);

    document.getElementById('nomeCidade').textContent = dados.estado
        ? `${dados.nome}, ${dados.estado}`
        : `${dados.nome}, ${dados.pais}`;

    document.getElementById('temperatura').textContent    = Math.round(dados.temperatura);
    document.getElementById('descricaoClima').textContent = infoClima.descricao;
    document.getElementById('velocidadeVento').textContent = `${dados.velocidadeVento} km/h`;
    document.getElementById('umidade').textContent         = dados.umidade != null ? `${dados.umidade}%` : 'N/D';
    document.getElementById('dataHora').textContent        = formatarDataHora(dados.horario);
    document.getElementById('iconeClima').className        = `icone-clima wi ${infoClima.icone}`;
    document.getElementById('tempMaxDia').textContent      = dados.tempMaxDia  != null ? dados.tempMaxDia  : '--';
    document.getElementById('tempMinDia').textContent      = dados.tempMinDia  != null ? dados.tempMinDia  : '--';
    document.getElementById('sensacaoTermica').textContent = dados.sensacaoTermica != null ? `${dados.sensacaoTermica}°C` : 'N/D';

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
function exibirElemento(id) {
    document.getElementById(id)?.classList.remove('oculto');
}

function ocultarElemento(id) {
    document.getElementById(id)?.classList.add('oculto');
}

// ========== AUTOCOMPLETE ==========
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
let buscaAtual = null;

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