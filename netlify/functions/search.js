exports.handler = async function(event, context) {
    // Lee la clave de API desde la variable de entorno de Netlify.
    const apiKey = process.env.GEMINI_API_KEY;

    // Asegúrate de que la clave de API esté configurada.
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API key no configurada." })
        };
    }

    try {
        // Analiza el cuerpo de la solicitud para obtener el término de búsqueda.
        const { searchTerm } = JSON.parse(event.body);

        const prompt = `Busca en internet precios para el producto "${searchTerm}" que se vendan en Argentina. Devuelve una lista de resultados.`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "producto": { "type": "STRING", "description": "Nombre completo del producto encontrado." },
                            "vendedor": { "type": "STRING", "description": "Nombre de la tienda o supermercado que lo vende." },
                            "precio": { "type": "STRING", "description": "Precio del producto con su moneda." },
                            "enlace": { "type": "STRING", "description": "URL directa a la página del producto." }
                        },
                        required: ["producto", "vendedor", "precio", "enlace"]
                    }
                }
            }
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.statusText}`);
        }

        const result = await response.json();
        const textPart = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textPart) {
            const products = JSON.parse(textPart);
            return {
                statusCode: 200,
                body: JSON.stringify({ products })
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "No se pudo obtener una respuesta válida del modelo." })
            };
        }

    } catch (error) {
        console.error('Error en la función de Netlify:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
