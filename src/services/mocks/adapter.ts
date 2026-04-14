import type { AxiosAdapter, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
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

  if (!match || !match.m) {
    return buildResponse(config, 404, { error: 'no_mock_handler', method, url });
  }

  const result = await match.handler.handle({ method, url, body }, match.m);
  return buildResponse(config, result.status, result.data);
};

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
