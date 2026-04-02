// ========== MOCKS GLOBAIS — devem existir ANTES do require ==========
// O Jest roda em Node.js, que não possui localStorage nem document.
// GerenciadorTema e GerenciadorFundo são instanciados no carregamento
// do módulo, então os mocks precisam estar prontos antes do require.

global.fetch = jest.fn();

global.localStorage = {
    getItem:    jest.fn(() => null),
    setItem:    jest.fn(),
    removeItem: jest.fn()
};

global.document = {
    querySelector:    jest.fn(() => null),
    getElementById:   jest.fn(() => null),
    addEventListener: jest.fn(),
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

/** Resposta simulada da API de geocodificação para São Paulo. */
const mockCoordenadasResposta = {
    results: [{
        name: 'São Paulo', admin1: 'São Paulo', country: 'Brazil',
        latitude: -23.5505, longitude: -46.6333
    }]
};

/** Resposta simulada da API de clima com todos os campos presentes. */
const mockClimaResposta = {
    current_weather: {
        temperature: 22.5, windspeed: 15.3, weathercode: 1,
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
        time:               ['2026-04-01','2026-04-02','2026-04-03','2026-04-04','2026-04-05','2026-04-06','2026-04-07','2026-04-08'],
        weathercode:        [1, 2, 3, 61, 80, 1, 0, 2],
        temperature_2m_max: [28, 26, 24, 20, 22, 27, 30, 25],
        temperature_2m_min: [18, 17, 16, 15, 14, 16, 19, 17]
    }
};

// ========== HELPERS ==========

/**
 * Configura o mock do fetch para retornar respostas em sequência.
 * Cada objeto deve ter { ok: boolean, data: Object }.
 */
function mockFetchSequence(...responses) {
    responses.forEach(({ ok, data }) => {
        fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok, json: () => Promise.resolve(data) })
        );
    });
}

/** Retorna um mock de resposta climática com current_weather mas sem o campo informado. */
function mockClimasSemCampo(campo) {
    const resposta = {
        current_weather: { temperature: 20, windspeed: 10, weathercode: 0, time: '2026-04-01T10:00' },
        hourly: { time: ['2026-04-01T10:00'], relative_humidity_2m: [60] },
        daily: mockClimaResposta.daily
    };
    delete resposta[campo];
    return resposta;
}

// ========== SETUP / TEARDOWN ==========
beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.clearAllMocks());

// =============================================================
// 3.6 — TESTES BÁSICOS
// =============================================================
describe('3.6 — Testes Básicos', () => {

    describe('1. Cidade válida retorna dados meteorológicos', () => {

        test('buscarCoordenadas retorna nome, estado, país e coordenadas corretos', async () => {
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCoordenadasResposta) });

            const resultado = await buscarCoordenadas('São Paulo');

            expect(resultado).toMatchObject({
                nome: 'São Paulo', estado: 'São Paulo', pais: 'Brazil',
                latitude: -23.5505, longitude: -46.6333
            });
        });

        test('buscarClima retorna todos os campos esperados com valores corretos', async () => {
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockClimaResposta) });

            const resultado = await buscarClima(-23.5505, -46.6333);

            expect(resultado).toMatchObject({
                temperatura:      22.5,
                velocidadeVento:  15.3,
                codigoClima:      1,
                tempMaxDia:       28,
                tempMinDia:       18,
                umidade:          expect.any(Number),
                sensacaoTermica:  expect.any(Number),
                previsaoSeteDias: expect.arrayContaining([
                    expect.objectContaining({
                        data: expect.any(String),
                        codigoClima:    expect.any(Number),
                        temperaturaMax: expect.any(Number),
                        temperaturaMin: expect.any(Number)
                    })
                ])
            });
            expect(resultado.previsaoSeteDias).toHaveLength(7);
        });

        test('buscarPrevisaoCompleta retorna objeto combinado com coordenadas e clima', async () => {
            // Usa cidade exclusiva para não colidir com cache de outros testes
            mockFetchSequence(
                { ok: true, data: mockCoordenadasResposta },
                { ok: true, data: mockClimaResposta }
            );

            const resultado = await buscarPrevisaoCompleta('Campinas');

            expect(resultado).toMatchObject({
                nome:            'São Paulo', // retornado pelo mock
                latitude:        expect.any(Number),
                temperatura:     expect.any(Number),
                previsaoSeteDias: expect.any(Array)
            });
        });

        test('umidade é extraída do índice correto em hourly.time', async () => {
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockClimaResposta) });

            const resultado = await buscarClima(-23.5505, -46.6333);

            // horario = '2026-04-01T14:00' → índice 14 → umidade = 65
            expect(resultado.umidade).toBe(65);
        });
    });

    describe('2. Cidade inexistente lança exceção tratada', () => {

        test.each([
            ['results vazio',     { results: [] }],
            ['results undefined', {}             ],
            ['results null',      { results: null }]
        ])('buscarCoordenadas lança CIDADE_NAO_ENCONTRADA quando %s', async (_, resposta) => {
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(resposta) });

            await expect(buscarCoordenadas('CidadeFalsa'))
                .rejects.toThrow('CIDADE_NAO_ENCONTRADA');
        });

        test('buscarPrevisaoCompleta propaga CIDADE_NAO_ENCONTRADA', async () => {
            fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [] }) });

            await expect(buscarPrevisaoCompleta('XxInexistenteXx'))
                .rejects.toThrow('CIDADE_NAO_ENCONTRADA');
        });
    });

    describe('3. Entrada vazia retorna erro de validação', () => {

        test.each([
            ['string vazia',         ''   ],
            ['só espaços',           '   '],
            ['null',                 null ],
            ['undefined',            undefined],
            ['número (tipo inválido)', 123 ]
        ])('validateCityInput rejeita: %s', (_, entrada) => {
            const resultado = validateCityInput(entrada);
            expect(resultado.isValid).toBe(false);
            expect(resultado.error).toBeDefined();
        });

        test('validateCityInput aceita nome de cidade válido', () => {
            expect(validateCityInput('Florianópolis')).toEqual({ isValid: true });
        });
    });

    describe('4. Falha da API gera resposta adequada', () => {

        test.each([
            ['buscarCoordenadas', () => buscarCoordenadas('São Paulo'),       'Erro ao buscar coordenadas'    ],
            ['buscarClima',       () => buscarClima(-23.5505, -46.6333),      'Erro ao buscar dados climáticos']
        ])('%s lança erro quando fetch retorna ok: false', async (_, chamarFuncao, mensagemEsperada) => {
            fetch.mockResolvedValueOnce({ ok: false, status: 500 });
            await expect(chamarFuncao()).rejects.toThrow(mensagemEsperada);
        });

        test('buscarClima lança erro quando current_weather está ausente na resposta', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ hourly: {}, daily: {} })
            });

            await expect(buscarClima(-23.5505, -46.6333))
                .rejects.toThrow('Dados climáticos indisponíveis');
        });

        test('rejeição de rede (Failed to fetch) é propagada diretamente', async () => {
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

    describe('Limite de requisições da API excedido (HTTP 429)', () => {

        test.each([
            ['buscarCoordenadas', () => buscarCoordenadas('Recife'),          'Erro ao buscar coordenadas'    ],
            ['buscarClima',       () => buscarClima(-8.0476, -34.877),        'Erro ao buscar dados climáticos']
        ])('%s trata HTTP 429 como erro', async (_, chamarFuncao, mensagemEsperada) => {
            fetch.mockResolvedValueOnce({ ok: false, status: 429 });
            await expect(chamarFuncao()).rejects.toThrow(mensagemEsperada);
        });

        test('buscarPrevisaoCompleta propaga erro de rate limit (cidade não cacheada)', async () => {
            // Cidade exclusiva para garantir ausência de cache
            fetch.mockResolvedValueOnce({ ok: false, status: 429 });

            await expect(buscarPrevisaoCompleta('Brasília'))
                .rejects.toThrow('Erro ao buscar coordenadas');
        });
    });

    describe('Conexão de rede lenta ou instável', () => {

        test.each([
            ['NetworkError', new Error('NetworkError when attempting to fetch resource')],
            ['Failed to fetch', new TypeError('Failed to fetch')]
        ])('erro de rede "%s" é propagado sem modificação', async (_, erroSimulado) => {
            fetch.mockRejectedValueOnce(erroSimulado);

            await expect(buscarCoordenadas('Manaus'))
                .rejects.toThrow(erroSimulado.message);
        });

        test('fetch é chamado exatamente uma vez por requisição (sem retry silencioso)', async () => {
            fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

            await buscarCoordenadas('Belém').catch(() => {});

            expect(fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('Mudança inesperada no formato da resposta JSON', () => {

        test('daily ausente → tempMaxDia e tempMinDia são null, previsão vazia', async () => {
            fetch.mockResolvedValueOnce({
                ok: true, json: () => Promise.resolve(mockClimasSemCampo('daily'))
            });

            const resultado = await buscarClima(-23.5505, -46.6333);

            expect(resultado.tempMaxDia).toBeNull();
            expect(resultado.tempMinDia).toBeNull();
            expect(resultado.previsaoSeteDias).toHaveLength(0);
        });

        test('hourly ausente → umidade é null', async () => {
            fetch.mockResolvedValueOnce({
                ok: true, json: () => Promise.resolve(mockClimasSemCampo('hourly'))
            });

            const resultado = await buscarClima(-23.5505, -46.6333);

            expect(resultado.umidade).toBeNull();
        });

        test('hourly ausente → sensacaoTermica igual à temperatura arredondada', async () => {
            fetch.mockResolvedValueOnce({
                ok: true, json: () => Promise.resolve(mockClimasSemCampo('hourly'))
            });

            const resultado = await buscarClima(-23.5505, -46.6333);

            // Sem umidade, a função retorna Math.round(temperatura)
            expect(resultado.sensacaoTermica).toBe(Math.round(resultado.temperatura));
        });

        test('current_weather ausente → lança Dados climáticos indisponíveis', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    hourly: { time: [], relative_humidity_2m: [] },
                    daily:  { time: [], weathercode: [], temperature_2m_max: [], temperature_2m_min: [] }
                })
            });

            await expect(buscarClima(-23.5505, -46.6333))
                .rejects.toThrow('Dados climáticos indisponíveis');
        });
    });

    describe('Funções auxiliares', () => {

        test.each([
            [0,  12, 'wi-day-sunny',   'limpo'   ],
            [0,  21, 'wi-night-clear', 'limpo'   ],
            [3,  10, 'wi-cloudy',      'nublado' ],
            [61, 15, 'wi-day-rain',    'chuva'   ]
        ])('obterInformacoesClima(código=%i, hora=%i) → ícone=%s, categoria=%s',
            (codigo, hora, iconeEsperado, categoriaEsperada) => {
                const info = obterInformacoesClima(codigo, hora);
                expect(info.icone).toBe(iconeEsperado);
                expect(info.categoria).toBe(categoriaEsperada);
            }
        );

        test('código WMO desconhecido retorna padrão (código 0 — céu limpo)', () => {
            const info = obterInformacoesClima(9999, 10);
            expect(info).toMatchObject({ descricao: 'Céu limpo', icone: 'wi-day-sunny', categoria: 'limpo' });
        });

        test('getWeatherDescription retorna descrição e ícone para código válido', () => {
            const info = getWeatherDescription(3, true);
            expect(info).toMatchObject({ description: 'Nublado', icon: expect.any(String) });
        });

        test.each([
            ['2026-04-01T14:00', '2026'],
            ['2025-12-31T23:59', '2025']
        ])('formatarDataHora(%s) contém o ano %s', (dataString, anoEsperado) => {
            const resultado = formatarDataHora(dataString);
            expect(typeof resultado).toBe('string');
            expect(resultado).toContain(anoEsperado);
        });
    });
});