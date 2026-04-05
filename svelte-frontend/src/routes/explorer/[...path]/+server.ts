import { error, type RequestHandler } from '@sveltejs/kit';

const TARGET_ORIGIN = 'https://explorer.yume.wiki';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'accept-encoding',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'content-encoding'
]);

function buildTargetUrl(path: string, url: URL) {
  const normalizedPath = path.replace(/^\/+/, '');
  const target = new URL(`${TARGET_ORIGIN}/${normalizedPath}`);
  target.search = url.search;
  return target;
}

function filterHeaders(headers: Headers) {
  const next = new Headers();
  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      next.set(key, value);
    }
  });
  return next;
}

const proxy: RequestHandler = async ({ params, request, url, fetch }) => {
  const path = params.path ?? '';
  if (!path) {
    throw error(400, 'Missing proxy path');
  }

  const targetUrl = buildTargetUrl(path, url);
  const method = request.method;
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  const upstreamResponse = await fetch(targetUrl, {
    method,
    headers: filterHeaders(request.headers),
    body: body ? body : undefined,
    redirect: 'manual'
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: filterHeaders(upstreamResponse.headers)
  });
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
