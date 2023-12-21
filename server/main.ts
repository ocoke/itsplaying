// itsplaying server

import handler from './handler.ts'

Deno.serve({
    port: Deno.env.get('PORT') || 8000,
}, handler)