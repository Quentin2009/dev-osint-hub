import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();

    // Récupération automatique de la clé d'environnement
    const formspreeKey = import.meta.env.FORMSPREE_KEY || process.env.FORMSPREE_KEY || 'xojgnlky';

    const res = await fetch(`https://formspree.io/f/${formspreeKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const errorData = await res.json();
      return new Response(JSON.stringify({ error: errorData }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};