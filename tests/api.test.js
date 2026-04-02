// ========== MOCKS GLOBAIS — devem existir ANTES do require ==========
// O Jest roda em Node.js, que não possui localStorage nem document.
// GerenciadorTema e GerenciadorFundo são instanciados no momento em que
// o módulo é carregado, então os mocks precisam estar prontos aqui.

global.fetch = jest.fn();

global.localStorage = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

global.document = {
    querySelector:       jest.fn(() => null),
    getElementById:      jest.fn(() => null),
    addEventListener:    jest.fn(),
    body: {
        classList: {
            contains: jest.fn(() => false),
            add:      jest.fn(),
            remove:   jest.fn(),
            toggle:   jest.fn()
        }
    }
};

// ========== IMPORTAÇÃO DO MÓDULO ==========
const {
    buscarCoordenadas,
    buscarClima,
    buscarPrevisaoCompleta,
    obterInformacoesClima,
    formatarDataHora,
    validateCityInput,
    getWeatherDescription
} = require('../assets/js/api');

// ========== DADOS SIMULADOS ==========
const mockCoordenadasResposta = {
    results: [
        {
            name: 'São Paulo',
            admin1: 'São Paulo',
            country: 'Brazil',
            latitude: -23.5505,
            longitude: -46.6333
        }
    ]
};

const mockClimaResposta = {
    current_weather: {
        temperature: 22.5,
        windspeed: 15.3,
        weathercode: 1,
        time: '2026-04-01T14:00'
    },
    hourly: {
        time: [
            '2026-04-01T00:00', '2026-04-01T01:00', '2026-04-01T02:00',
            '2026-04-01T03:00', '2026-04-01T04:00', '2026-04-01T05:00',
            '2026-04-01T06:00', '2026-04-01T07:00', '2026-04-01T08:00',
            '2026-04-01T09:00', '2026-04-01T10:00', '2026-04-01T11:00',
            '2026-04-01T12:00', '2026-04-01T13:00', '2026-04-01T14:00'
        ],
        relative_humidity_2m: [80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 65]
    },
    daily: {
        time: [
            '2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04',
            '2026-04-05', '2026-04-06', '2026-04-07', '2026-04-08'
        ],
        weathercode:        [1, 2, 3, 61, 80, 1, 0, 2],
        temperature_2m_max: [28, 26, 24, 20, 22, 27, 30, 25],
        temperature_2m_min: [18, 17, 16, 15, 14, 16, 19, 17]
    }
};

// Helper: configura fetch para retornar respostas em sequência
function mockFetchSequence(...responses) {
    responses.forEach(({ ok, data }) => {
        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok,
                json: () => Promise.resolve(data),
                status: ok ? 200 : 500
            })
        );
    });
}

// ========== SETUP / TEARDOWN ==========
beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.clearAllMocks();
});

// =============================================================
// 3.6 — TESTES BÁSICOS
// =============================================================
describe('3.6 — Testes Básicos', () => {

    // ----- Teste 1: cidade válida retorna dados meteorológicos -----
    describe('1. Cidade válida retorna dados meteorológicos', () => {

        test('buscarCoordenadas retorna latitude, longitude e nome corretos', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockCoordenadasResposta)
            });

            const resultado = await buscarCoordenadas('São Paulo');

            expect(resultado).toMatchObject({
                nome: 'São Paulo',
                estado: 'São Paulo',
                pais: 'Brazil',
                latitude: -23.5505,
                longitude: -46.6333
            });
        });

        test('buscarClima retorna temperatura, vento, umidade, sensação térmica e previsão 7 dias', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockClimaResposta)
            });

            const resultado = await buscarClima(-23.5505, -46.6333);

            expect(resultado.temperatura).toBe(22.5);
            expect(resultado.velocidadeVento).toBe(15.3);
            expect(resultado.codigoClima).toBe(1);
            expect(resultado.umidade).toBeDefined();
            expect(resultado.sensacaoTermica).toBeDefined();
            expect(resultado.tempMaxDia).toBe(28);
            expect(resultado.tempMinDia).toBe(18);
            expect(resultado.previsaoSeteDias).toHaveLength(7);
        });

        test('buscarPrevisaoCompleta retorna objeto com todos os campos esperados', async () => {
            mockFetchSequence(
                { ok: true, data: mockCoordenadasResposta },
                { ok: true, data: mockClimaResposta }
            );

            const resultado = await buscarPrevisaoCompleta('São Paulo');

            expect(resultado).toMatchObject({
                nome: 'São Paulo',
                latitude: expect.any(Number),
                longitude: expect.any(Number),
                temperatura: expect.any(Number),
                codigoClima: expect.any(Number),
                previsaoSeteDias: expect.any(Array)
            });
        });

        test('previsão semanal contém os campos corretos em cada dia', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockClimaResposta)
            });

            const resultado = await buscarClima(-23.5505, -46.6333);

            resultado.previsaoSeteDias.forEach(dia => {
                expect(dia).toMatchObject({
                    data: expect.any(String),
                    codigoClima: expect.any(Number),
                    temperaturaMax: expect.any(Number),
                    temperaturaMin: expect.any(Number)
                });
            });
        });
    });

    // ----- Teste 2: cidade inexistente lança exceção -----
    describe('2. Cidade inexistente lança exceção tratada', () => {

        test('buscarCoordenadas lança CIDADE_NAO_ENCONTRADA quando results está vazio', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ results: [] })
            });

            await expect(buscarCoordenadas('XxCidadeInexistenteXx'))
                .rejects.toThrow('CIDADE_NAO_ENCONTRADA');
        });

        test('buscarCoordenadas lança CIDADE_NAO_ENCONTRADA quando results é undefined', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({})
            });

            await expect(buscarCoordenadas('???'))
                .rejects.toThrow('CIDADE_NAO_ENCONTRADA');
        });

        test('buscarPrevisaoCompleta propaga o erro CIDADE_NAO_ENCONTRADA', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ results: [] })
            });

            await expect(buscarPrevisaoCompleta('CidadeFalsa'))
                .rejects.toThrow('CIDADE_NAO_ENCONTRADA');
        });
    });

    // ----- Teste 3: entrada vazia retorna erro de validação -----
    describe('3. Entrada vazia retorna erro de validação', () => {

        test('string vazia é inválida', () => {
            const resultado = validateCityInput('');
            expect(resultado.isValid).toBe(false);
            expect(resultado.error).toBeDefined();
        });

        test('string só com espaços é inválida', () => {
            const resultado = validateCityInput('   ');
            expect(resultado.isValid).toBe(false);
        });

        test('null é inválido', () => {
            const resultado = validateCityInput(null);
            expect(resultado.isValid).toBe(false);
        });

        test('undefined é inválido', () => {
            const resultado = validateCityInput(undefined);
            expect(resultado.isValid).toBe(false);
        });

        test('número não é uma entrada válida', () => {
            const resultado = validateCityInput(123);
            expect(resultado.isValid).toBe(false);
        });

        test('nome de cidade válido passa na validação', () => {
            const resultado = validateCityInput('Rio de Janeiro');
            expect(resultado.isValid).toBe(true);
            expect(resultado.error).toBeUndefined();
        });
    });

    // ----- Teste 4: falha da API gera resposta adequada -----
    describe('4. Falha da API gera resposta adequada', () => {

        test('buscarCoordenadas lança erro quando fetch retorna ok: false', async () => {
            fetch.mockResolvedValueOnce({ ok: false, status: 500 });

            await expect(buscarCoordenadas('São Paulo'))
                .rejects.toThrow('Erro ao buscar coordenadas');
        });

        test('buscarClima lança erro quando fetch retorna ok: false', async () => {
            fetch.mockResolvedValueOnce({ ok: false, status: 503 });

            await expect(buscarClima(-23.5505, -46.6333))
                .rejects.toThrow('Erro ao buscar dados climáticos');
        });

        test('buscarClima lança erro quando current_weather está ausente', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ daily: {}, hourly: {} })
            });

            await expect(buscarClima(-23.5505, -46.6333))
                .rejects.toThrow('Dados climáticos indisponíveis');
        });

        test('timeout / rejeição de rede propaga o erro corretamente', async () => {
            fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(buscarCoordenadas('São Paulo'))
                .rejects.toThrow('Failed to fetch');
        });
    });
});

// =============================================================
// 3.7 — CASOS EXTREMOS
// =============================================================
describe('3.7 — Casos Extremos', () => {

    // ----- Limite de requisições excedido (HTTP 429) -----
    describe('Limite de requisições da API excedido', () => {

        test('buscarCoordenadas lança erro quando a API retorna 429', async () => {
            fetch.mockResolvedValueOnce({ ok: false, status: 429 });

            await expect(buscarCoordenadas('São Paulo'))
                .rejects.toThrow('Erro ao buscar coordenadas');
        });

        test('buscarClima lança erro quando a API retorna 429', async () => {
            fetch.mockResolvedValueOnce({ ok: false, status: 429 });

            await expect(buscarClima(-23.5505, -46.6333))
                .rejects.toThrow('Erro ao buscar dados climáticos');
        });

        test('buscarPrevisaoCompleta propaga erro de rate limit', async () => {
            // Usa cidade diferente para evitar hit no cache dos testes anteriores
            fetch.mockResolvedValueOnce({ ok: false, status: 429 });

            await expect(buscarPrevisaoCompleta('Brasília'))
                .rejects.toThrow('Erro ao buscar coordenadas');
        });
    });

    // ----- Conexão lenta / instável -----
    describe('Conexão de rede lenta ou instável', () => {

        test('buscarCoordenadas lança erro de rede (NetworkError)', async () => {
            // fetch.mockRejectedValueOnce simula a rejeição da Promise antes do ok check,
            // então o erro original da rede é propagado diretamente
            fetch.mockRejectedValueOnce(new Error('NetworkError when attempting to fetch resource'));

            await expect(buscarCoordenadas('São Paulo'))
                .rejects.toThrow('NetworkError when attempting to fetch resource');
        });

        test('buscarClima lança erro quando a conexão cai no meio', async () => {
            fetch.mockRejectedValueOnce(new TypeError('NetworkError when attempting to fetch resource'));

            await expect(buscarClima(-23.5505, -46.6333))
                .rejects.toThrow('NetworkError when attempting to fetch resource');
        });

        test('buscarPrevisaoCompleta propaga erro de conexão instável', async () => {
            fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(buscarPrevisaoCompleta('Curitiba'))
                .rejects.toThrow('Failed to fetch');
        });

        test('fetch chamado exatamente uma vez por busca (sem retentativa silenciosa)', async () => {
            fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

            await buscarCoordenadas('São Paulo').catch(() => {});

            expect(fetch).toHaveBeenCalledTimes(1);
        });
    });

    // ----- Mudança inesperada no formato do JSON -----
    describe('Mudança inesperada no formato da resposta JSON', () => {

        test('buscarClima lança erro quando current_weather está ausente', async () => {
            // Mock exclusivo para este teste — não reutiliza mock de teste anterior
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    hourly: { time: [], relative_humidity_2m: [] },
                    daily:  { time: [], weathercode: [], temperature_2m_max: [], temperature_2m_min: [] }
                    // current_weather propositalmente ausente
                })
            });

            await expect(buscarClima(-23.5505, -46.6333))
                .rejects.toThrow('Dados climáticos indisponíveis');
        });

        test('buscarClima lida com daily ausente e retorna tempMaxDia null', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    current_weather: {
                        temperature: 20,
                        windspeed: 10,
                        weathercode: 0,
                        time: '2026-04-01T10:00'
                    },
                    hourly: { time: ['2026-04-01T10:00'], relative_humidity_2m: [60] }
                    // daily propositalmente ausente
                })
            });

            const resultado = await buscarClima(-23.5505, -46.6333);

            expect(resultado.tempMaxDia).toBeNull();
            expect(resultado.tempMinDia).toBeNull();
            expect(resultado.previsaoSeteDias).toHaveLength(0);
        });

        test('buscarClima lida com hourly ausente e retorna umidade null', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    current_weather: {
                        temperature: 25,
                        windspeed: 8,
                        weathercode: 2,
                        time: '2026-04-01T12:00'
                    },
                    daily: mockClimaResposta.daily
                    // hourly propositalmente ausente — umidade deve ser null
                })
            });

            const resultado = await buscarClima(-23.5505, -46.6333);

            expect(resultado.umidade).toBeNull();
        });

        test('buscarCoordenadas lança erro quando results é null', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ results: null })
            });

            await expect(buscarCoordenadas('São Paulo'))
                .rejects.toThrow('CIDADE_NAO_ENCONTRADA');
        });

        test('buscarClima retorna sensacaoTermica igual à temperatura quando umidade é null', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    current_weather: {
                        temperature: 18,
                        windspeed: 3,
                        weathercode: 0,
                        time: '2026-04-01T08:00'
                    },
                    daily: mockClimaResposta.daily
                    // hourly ausente → umidade null → sensação = temperatura
                })
            });

            const resultado = await buscarClima(-23.5505, -46.6333);

            expect(resultado.sensacaoTermica).toBe(Math.round(18));
        });
    });

    // ----- Funções auxiliares -----
    describe('Funções auxiliares — obterInformacoesClima e formatarDataHora', () => {

        test('obterInformacoesClima retorna ícone diurno durante o dia', () => {
            const info = obterInformacoesClima(0, 12);
            expect(info.icone).toBe('wi-day-sunny');
            expect(info.categoria).toBe('limpo');
        });

        test('obterInformacoesClima retorna ícone noturno durante a noite', () => {
            const info = obterInformacoesClima(0, 21);
            expect(info.icone).toBe('wi-night-clear');
        });

        test('obterInformacoesClima retorna código padrão para código desconhecido', () => {
            const info = obterInformacoesClima(9999, 10);
            expect(info).toMatchObject({
                descricao: 'Céu limpo',
                icone: 'wi-day-sunny',
                categoria: 'limpo'
            });
        });

        test('getWeatherDescription retorna descrição e ícone para código válido', () => {
            const info = getWeatherDescription(3, true);
            expect(info.description).toBe('Nublado');
            expect(info.icon).toBeDefined();
        });

        test('formatarDataHora retorna string não vazia para data válida', () => {
            const resultado = formatarDataHora('2026-04-01T14:00');
            expect(typeof resultado).toBe('string');
            expect(resultado.length).toBeGreaterThan(0);
        });

        test('formatarDataHora contém o ano correto', () => {
            const resultado = formatarDataHora('2026-04-01T14:00');
            expect(resultado).toContain('2026');
        });
    });
});