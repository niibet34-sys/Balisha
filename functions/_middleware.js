/**
 * Cloudflare Pages: keep staging and branch previews out of search.
 * Our canonical pages remain indexable at https://balisha.ru.
 */
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const production = ['balisha.ru', 'www.balisha.ru'].includes(url.hostname);
  if (!production && url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex, nofollow' },
    });
  }
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  if (!production) headers.set('x-robots-tag', 'noindex, nofollow');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
