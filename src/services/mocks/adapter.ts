import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { handlers, type MockRequest } from './handlers';

export const useMocks = (process.env.EXPO_PUBLIC_USE_MOCKS ?? 'true') !== 'false';

function normalizeUrl(config: InternalAxiosRequestConfig): string {
  const raw = config.url ?? '/';
  if (raw.startsWith('http')) {
    try {
      return new URL(raw).pathname;
    } catch {
      return raw;
    }
  }
  return raw;
}

export const mockAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? 'GET').toUpperCase() as MockRequest['method'];
  const url = normalizeUrl(config);
  const body = typeof config.data === 'string' ? safeJsonParse(config.data) : config.data;

  const match = handlers
    .filter((h) => h.method === method)
    .map((h) => ({ handler: h, m: url.match(h.pattern) }))
    .find((x) => x.m !== null);

  const response = match?.m
    ? buildResponse(config, ...(await resolveHandlerResult(match.handler.handle({ method, url, body }, match.m))))
    : buildResponse(config, 404, { error: 'no_mock_handler', method, url });

  return settleStatus(config, response);
};

async function resolveHandlerResult(
  resultOrPromise: Promise<{ status: number; data: any }> | { status: number; data: any },
): Promise<[number, any]> {
  const result = await resultOrPromise;
  return [result.status, result.data];
}

function settleStatus(config: InternalAxiosRequestConfig, response: AxiosResponse): AxiosResponse {
  const validateStatus = config.validateStatus ?? ((s: number) => s >= 200 && s < 300);
  if (!validateStatus(response.status)) {
    throw new AxiosError(
      `Request failed with status code ${response.status}`,
      response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response,
    );
  }
  return response;
}

function safeJsonParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function buildResponse(config: InternalAxiosRequestConfig, status: number, data: any): AxiosResponse {
  return {
    data,
    status,
    statusText: status >= 400 ? 'MOCK_ERROR' : 'OK',
    headers: {},
    config,
    request: null,
  };
}
