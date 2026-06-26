// Klivox Automatizaciones — Chat de soporte con Claude
// Función serverless para Vercel. Requiere la variable de entorno ANTHROPIC_API_KEY.

const SYSTEM_PROMPT = `Eres el asistente de soporte de "Klivox Automatizaciones", una empresa que ofrece
tecnología, inteligencia artificial y automatización para consultorios y clínicas odontológicas.

Soluciones de Klivox:
- Odontología digital (digitalización integral del consultorio)
- Historia clínica digital con odontograma, consentimientos y fórmulas
- CRM odontológico (gestión de pacientes, embudos, seguimiento y reactivación)
- Detector de implantes con IA (identificación de marcas/referencias)
- Agentes chatbot con IA (atención 24/7 en WhatsApp y web)
- Apps de agendamiento de citas con recordatorios automáticos
- Automatización de WhatsApp, marketing y procesos internos
- Desarrollos de software a la medida

Tono: cercano, profesional, claro y orientado a resultados. Responde SIEMPRE en español.
Sé breve (2-5 frases). Tu objetivo es entender la necesidad del odontólogo y orientarlo hacia
la solución de Klivox adecuada, e invitarlo a dejar sus datos o escribir a info@klivox.co.
No inventes precios exactos; si preguntan por precios, di que se cotiza según el proyecto y
ofrece poner en contacto al equipo. El WhatsApp estará disponible próximamente.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(200).json({
      reply: 'El asistente con IA aún no está configurado. Por favor escríbenos a info@klivox.co y te ayudamos enseguida.'
    });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const trimmed = messages.slice(-12).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000)
    }));

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: trimmed
      })
    });

    if (!anthropicRes.ok) {
      const errTxt = await anthropicRes.text();
      console.error('Anthropic error:', anthropicRes.status, errTxt);
      res.status(200).json({
        reply: 'Tuvimos un inconveniente técnico momentáneo. Escríbenos a info@klivox.co y te respondemos enseguida.'
      });
      return;
    }

    const data = await anthropicRes.json();
    const reply = (data.content && data.content[0] && data.content[0].text)
      ? data.content[0].text.trim()
      : 'Gracias por tu mensaje. Te responderemos muy pronto.';

    res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat handler error:', err);
    res.status(200).json({
      reply: 'Gracias por escribir. En este momento no pude procesar tu mensaje; contáctanos en info@klivox.co.'
    });
  }
};
