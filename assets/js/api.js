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
    0: {
        descricao: 'Céu limpo',
        iconeDia: 'wi-day-sunny',
        iconeNoite: 'wi-night-clear',
        categoria: 'limpo'
    },
    1: {
        descricao: 'Principalmente limpo',
        iconeDia: 'wi-day-sunny-overcast',
        iconeNoite: 'wi-night-alt-partly-cloudy',
        categoria: 'limpo'
    },
    2: {
        descricao: 'Parcialmente nublado',
        iconeDia: 'wi-day-cloudy',
        iconeNoite: 'wi-night-alt-cloudy',
        categoria: 'nublado'
    },
    3: {
        descricao: 'Nublado',
        iconeDia: 'wi-cloudy',
        iconeNoite: 'wi-cloudy',
        categoria: 'nublado'
    },
    45: {
        descricao: 'Neblina',
        iconeDia: 'wi-day-fog',
        iconeNoite: 'wi-night-fog',
        categoria: 'nublado'
    },
    48: {
        descricao: 'Nevoeiro com geada',
        iconeDia: 'wi-day-fog',
        iconeNoite: 'wi-night-fog',
        categoria: 'nublado'
    },
    51: {
        descricao: 'Garoa leve',
        iconeDia: 'wi-day-sprinkle',
        iconeNoite: 'wi-night-alt-sprinkle',
        categoria: 'chuva'
    },
    53: {
        descricao: 'Garoa moderada',
        iconeDia: 'wi-day-sprinkle',
        iconeNoite: 'wi-night-alt-sprinkle',
        categoria: 'chuva'
    },
    55: {
        descricao: 'Garoa intensa',
        iconeDia: 'wi-day-rain',
        iconeNoite: 'wi-night-alt-rain',
        categoria: 'chuva'
    },
    56: {
        descricao: 'Garoa congelante leve',
        iconeDia: 'wi-day-sleet',
        iconeNoite: 'wi-night-alt-sleet',
        categoria: 'chuva'
    },
    57: {
        descricao: 'Garoa congelante intensa',
        iconeDia: 'wi-day-sleet',
        iconeNoite: 'wi-night-alt-sleet',
        categoria: 'chuva'
    },
    61: {
        descricao: 'Chuva leve',
        iconeDia: 'wi-day-rain',
        iconeNoite: 'wi-night-alt-rain',
        categoria: 'chuva'
    },
    63: {
        descricao: 'Chuva moderada',
        iconeDia: 'wi-day-rain',
        iconeNoite: 'wi-night-alt-rain',
        categoria: 'chuva'
    },
    65: {
        descricao: 'Chuva intensa',
        iconeDia: 'wi-day-rain-wind',
        iconeNoite: 'wi-night-alt-rain-wind',
        categoria: 'chuva'
    },
    66: {
        descricao: 'Chuva congelante leve',
        iconeDia: 'wi-day-sleet',
        iconeNoite: 'wi-night-alt-sleet',
        categoria: 'chuva'
    },
    67: {
        descricao: 'Chuva congelante intensa',
        iconeDia: 'wi-day-sleet',
        iconeNoite: 'wi-night-alt-sleet',
        categoria: 'chuva'
    },
    71: {
        descricao: 'Neve leve',
        iconeDia: 'wi-day-snow',
        iconeNoite: 'wi-night-alt-snow',
        categoria: 'chuva'
    },
    73: {
        descricao: 'Neve moderada',
        iconeDia: 'wi-day-snow',
        iconeNoite: 'wi-night-alt-snow',
        categoria: 'chuva'
    },
    75: {
        descricao: 'Neve intensa',
        iconeDia: 'wi-day-snow-wind',
        iconeNoite: 'wi-night-alt-snow-wind',
        categoria: 'chuva'
    },
    77: {
        descricao: 'Granizo',
        iconeDia: 'wi-day-hail',
        iconeNoite: 'wi-night-alt-hail',
        categoria: 'chuva'
    },
    80: {
        descricao: 'Pancadas de chuva leves',
        iconeDia: 'wi-day-showers',
        iconeNoite: 'wi-night-alt-showers',
        categoria: 'chuva'
    },
    81: {
        descricao: 'Pancadas de chuva moderadas',
        iconeDia: 'wi-day-showers',
        iconeNoite: 'wi-night-alt-showers',
        categoria: 'chuva'
    },
    82: {
        descricao: 'Pancadas de chuva intensas',
        iconeDia: 'wi-day-storm-showers',
        iconeNoite: 'wi-night-alt-storm-showers',
        categoria: 'chuva'
    },
    85: {
        descricao: 'Pancadas de neve leves',
        iconeDia: 'wi-day-snow',
        iconeNoite: 'wi-night-alt-snow',
        categoria: 'chuva'
    },
    86: {
        descricao: 'Pancadas de neve intensas',
        iconeDia: 'wi-day-snow-wind',
        iconeNoite: 'wi-night-alt-snow-wind',
        categoria: 'chuva'
    },
    95: {
        descricao: 'Trovoada',
        iconeDia: 'wi-day-thunderstorm',
        iconeNoite: 'wi-night-alt-thunderstorm',
        categoria: 'chuva'
    },
    96: {
        descricao: 'Trovoada com granizo leve',
        iconeDia: 'wi-day-thunderstorm',
        iconeNoite: 'wi-night-alt-thunderstorm',
        categoria: 'chuva'
    },
    99: {
        descricao: 'Trovoada com granizo intenso',
        iconeDia: 'wi-day-storm-showers',
        iconeNoite: 'wi-night-alt-storm-showers',
        categoria: 'chuva'
    }
};

// ========== CACHE DE SESSÃO ==========
class CacheClima {
    constructor() {
        this.cache = new Map();
    }

    obter(chave) {
        const item = this.cache.get(chave);
        if (!item) return null;

        const agora = Date.now();
        if (agora - item.timestamp > CONFIG.CACHE_EXPIRATION) {
            this.cache.delete(chave);
            return null;
        }

        return item.dados;
    }

    salvar(chave, dados) {
        this.cache.set(chave, {
            dados,
            timestamp: Date.now()
        });
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
        if (tema === 'escuro') {
            document.body.classList.add('tema-escuro');
        } else {
            document.body.classList.remove('tema-escuro');
        }
        this.atualizarIconeTema(tema);
    }

    atualizarIconeTema(tema) {
        const iconeTema = document.querySelector('.icone-tema');
        if (tema === 'escuro') {
            iconeTema.className = 'wi wi-night-clear icone-tema';
        } else {
            iconeTema.className = 'wi wi-day-sunny icone-tema';
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

        const ehDia = hora >= 6 && hora < 18;
        const tema = ehDia ? 'claro' : 'escuro';
        this.aplicarTema(tema);
    }
}

const gerenciadorTema = new GerenciadorTema();

// ========== GERENCIADOR DE FUNDO DINÂMICO ==========
class GerenciadorFundo {
    aplicarFundo(hora, categoria) {
        const fundoDinamico = document.getElementById('fundoDinamico');
        fundoDinamico.className = 'fundo-dinamico';

        const ehDia = hora >= 6 && hora < 18;
        const periodo = ehDia ? 'dia' : 'noite';
        const classeCategoria = `${periodo}-${categoria}`;

        fundoDinamico.classList.add(classeCategoria);
    }
}

const gerenciadorFundo = new GerenciadorFundo();

// ========== FORMATAÇÃO DE DATA ==========
function formatarDataHora(dataString, timezoneOffset = 0) {
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

// ========== OBTER INFORMAÇÕES CLIMÁTICAS ==========
function obterInformacoesClima(codigoClima, hora) {
    const info = CODIGOS_CLIMA[codigoClima] || CODIGOS_CLIMA[0];
    const ehDia = hora >= 6 && hora < 18;
    const icone = ehDia ? info.iconeDia : info.iconeNoite;

    return {
        descricao: info.descricao,
        icone: icone,
        categoria: info.categoria
    };
}

// ========== API: BUSCAR COORDENADAS ==========
async function buscarCoordenadas(nomeCidade) {
    const url = `${CONFIG.URLS.GEOCODING}?name=${encodeURIComponent(nomeCidade)}&count=1&language=pt&format=json`;

    const resposta = await fetch(url);
    if (!resposta.ok) {
        throw new Error('Erro ao buscar coordenadas');
    }

    const dados = await resposta.json();

    if (!dados.results || dados.results.length === 0) {
        throw new Error('CIDADE_NAO_ENCONTRADA');
    }

    return {
        nome: dados.results[0].name,
        estado: dados.results[0].admin1 || '',
        pais: dados.results[0].country || '',
        latitude: dados.results[0].latitude,
        longitude: dados.results[0].longitude
    };
}

// ========== API: BUSCAR CLIMA ==========
async function buscarClima(latitude, longitude) {
    const url = `${CONFIG.URLS.WEATHER}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m&timezone=auto`;

    const resposta = await fetch(url);
    if (!resposta.ok) {
        throw new Error('Erro ao buscar dados climáticos');
    }

    const dados = await resposta.json();

    if (!dados.current_weather) {
        throw new Error('Dados climáticos indisponíveis');
    }

    const horaAtual = new Date().getHours();
    const umidade = dados.hourly && dados.hourly.relative_humidity_2m
        ? dados.hourly.relative_humidity_2m[horaAtual]
        : null;

    return {
        temperatura: dados.current_weather.temperature,
        velocidadeVento: dados.current_weather.windspeed,
        codigoClima: dados.current_weather.weathercode,
        horario: dados.current_weather.time,
        umidade: umidade
    };
}

// ========== BUSCAR PREVISÃO COMPLETA ==========
async function buscarPrevisaoCompleta(nomeCidade) {
    const chaveCache = nomeCidade.toLowerCase().trim();
    const dadosCache = cacheClima.obter(chaveCache);

    if (dadosCache) {
        return dadosCache;
    }

    const coordenadas = await buscarCoordenadas(nomeCidade);
    const clima = await buscarClima(coordenadas.latitude, coordenadas.longitude);

    const resultado = {
        ...coordenadas,
        ...clima
    };

    cacheClima.salvar(chaveCache, resultado);

    return resultado;
}

// ========== EXIBIR RESULTADOS ==========
function exibirResultados(dados) {
    const hora = new Date(dados.horario).getHours();
    const infoClima = obterInformacoesClima(dados.codigoClima, hora);

    document.getElementById('nomeCidade').textContent =
        dados.estado ? `${dados.nome}, ${dados.estado}` : `${dados.nome}, ${dados.pais}`;

    document.getElementById('temperatura').textContent = Math.round(dados.temperatura);
    document.getElementById('descricaoClima').textContent = infoClima.descricao;
    document.getElementById('velocidadeVento').textContent = `${dados.velocidadeVento} km/h`;
    document.getElementById('umidade').textContent = dados.umidade ? `${dados.umidade}%` : 'N/D';
    document.getElementById('dataHora').textContent = formatarDataHora(dados.horario);

    const iconeClima = document.getElementById('iconeClima');
    iconeClima.className = `icone-clima wi ${infoClima.icone}`;

    gerenciadorTema.definirTemaAutomatico(hora);
    gerenciadorFundo.aplicarFundo(hora, infoClima.categoria);

    ocultarElemento('indicadorCarregamento');
    ocultarElemento('areaErro');
    exibirElemento('areaResultados');
}

// ========== EXIBIR ERRO ==========
function exibirErro(mensagem, permitirTentarNovamente = false) {
    document.getElementById('mensagemErro').textContent = mensagem;

    const botaoTentarNovamente = document.getElementById('botaoTentarNovamente');
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
    document.getElementById(id).classList.remove('oculto');
}

function ocultarElemento(id) {
    document.getElementById(id).classList.add('oculto');
}

// ========== PROCESSAR BUSCA ==========
let buscaAtual = null;

async function processarBusca() {
    const campoCidade = document.getElementById('campoCidade');
    const nomeCidade = campoCidade.value.trim();

    if (!nomeCidade) {
        exibirErro('Por favor, digite o nome de uma cidade.');
        return;
    }

    if (buscaAtual) {
        buscaAtual.cancelada = true;
    }

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
        if (buscaAtual === busca) {
            buscaAtual = null;
        }
    }
}

// ========== DEBOUNCE ==========
function debounce(funcao, atraso) {
    let timeout;
    return function(...args) {
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

    campoCidade.addEventListener('keypress', (evento) => {
        if (evento.key === 'Enter') {
            processarBusca();
        }
    });

    botaoTema.addEventListener('click', () => {
        gerenciadorTema.alternarTema();
    });

    botaoTentarNovamente.addEventListener('click', processarBusca);

    campoCidade.focus();
});
