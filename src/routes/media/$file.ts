// Serves uploaded images. Names are random and never reused, so they can be cached forever.
import { createFileRoute } from '@tanstack/react-router';
import { readUpload } from '@/server/uploads.server';

export const Route = createFileRoute('/media/$file')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const file = readUpload(params.file);
        if (!file) return new Response('Not found', { status: 404 });
        return new Response(new Uint8Array(file.body), {
          headers: { 'content-type': file.type, 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' },
        });
      },
    },
  },
});
