/**
 * Balisha Pages security and launch SEO controls.
 * Keep preview domains and unpublished legacy knowledge pages out of search.
 * Remove LEGACY_UNPUBLISHED when those pages have been editorially approved.
 */
const LEGACY_UNPUBLISHED = /^\/(?:temy|stati|poisk|novosti|o-proekte|redakciya)(?:\/|$)/;
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const production = ['balisha.ru', 'www.balisha.ru'].includes(url.hostname);
  if (/^\/putevoditel\/?$/.test(url.pathname)) {
    return Response.redirect(new URL('/', url), 301);
  }
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
  else if (LEGACY_UNPUBLISHED.test(url.pathname)) headers.set('x-robots-tag', 'noindex, follow');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
