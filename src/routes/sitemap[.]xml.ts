// /sitemap.xml, generated on request from the database (see src/server/sitemap.server.ts).
import { createFileRoute } from '@tanstack/react-router';
import { buildSitemap } from '@/server/sitemap.server';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemap(), {
          headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
        }),
    },
  },
});
