// Image upload for the admin editors (multipart form field "file"). Requires an admin session;
// the session cookie is SameSite=Strict and the Origin must match, so other sites cannot post here.
import { createFileRoute } from '@tanstack/react-router';
import { OrderError } from '@/server/errors.server';
import { requireAdmin } from '@/server/request.server';
import { MAX_UPLOAD_BYTES, saveUpload } from '@/server/uploads.server';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const Route = createFileRoute('/api/admin/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get('origin');
        if (origin && new URL(origin).host !== new URL(request.url).host && origin !== process.env['PUBLIC_SITE_URL']) return json({ error: 'Fel ursprung.' }, 403);
        try {
          requireAdmin();
        } catch {
          return json({ error: 'Inte inloggad.' }, 401);
        }
        if (Number(request.headers.get('content-length') ?? 0) > MAX_UPLOAD_BYTES + 64 * 1024) return json({ error: 'Bilden är för stor (max 5 MB).' }, 413);
        const form = await request.formData().catch(() => null);
        const file = form?.get('file');
        if (!(file instanceof File)) return json({ error: 'Ingen fil skickades.' }, 400);
        try {
          return json({ url: saveUpload(new Uint8Array(await file.arrayBuffer())) });
        } catch (error) {
          if (error instanceof OrderError) return json({ error: error.message }, 400);
          throw error;
        }
      },
    },
  },
});
