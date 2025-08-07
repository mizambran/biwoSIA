// --- Referencias a los elementos del DOM ---
        const searchForm = document.getElementById('search-form');
        const productSearchInput = document.getElementById('product-search');
        const resultsContainer = document.getElementById('results-container');
        const initialMessage = document.getElementById('initial-message');

        // --- ¡IMPORTANTE! Configura tu API Key aquí ---
        // 1. Obtén tu clave desde Google AI Studio: https://aistudio.google.com/app/apikey
        // 2. Reemplaza el texto "AQUÍ_VA_TU_API_KEY" con tu clave.
        const apiKey = "AQUÍ_VA_TU_API_KEY";

        // --- Función para mostrar el indicador de carga ---
        function showLoader() {
            resultsContainer.innerHTML = '<div class="flex justify-center py-10"><div class="loader"></div></div>';
        }

        // --- Función para mostrar los resultados ---
        function displayResults(products) {
            resultsContainer.innerHTML = ''; // Limpiar resultados anteriores
            if (!products || products.length === 0) {
                resultsContainer.innerHTML = '<p class="text-center text-gray-500 py-10">No se encontraron resultados para tu búsqueda.</p>';
                return;
            }

            const resultsList = document.createElement('div');
            resultsList.className = 'space-y-4';

            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'p-4 border rounded-lg hover:shadow-md transition-shadow';

                const productName = document.createElement('h3');
                productName.className = 'text-lg font-semibold text-gray-800';
                productName.textContent = product.producto || 'Producto no especificado';

                const seller = document.createElement('p');
                seller.className = 'text-sm text-gray-600';
                seller.textContent = `Vendido por: ${product.vendedor || 'Vendedor no especificado'}`;

                const price = document.createElement('p');
                price.className = 'text-lg font-bold text-indigo-600 mt-2';
                price.textContent = product.precio || 'Precio no disponible';

                const link = document.createElement('a');
                link.href = product.enlace || '#';
                link.textContent = 'Ir al sitio web';
                link.target = '_blank'; // Abrir en nueva pestaña
                link.rel = 'noopener noreferrer';
                link.className = 'inline-block mt-3 text-sm font-medium text-indigo-500 hover:text-indigo-700';
                
                link.innerHTML += ' &rarr;';


                card.appendChild(productName);
                card.appendChild(seller);
                card.appendChild(price);
                if(product.enlace) {
                    card.appendChild(link);
                }

                resultsList.appendChild(card);
            });

            resultsContainer.appendChild(resultsList);
        }
        
        // --- Función para mostrar errores ---
        function displayError(message) {
             resultsContainer.innerHTML = `<p class="text-center text-red-500 py-10">${message}</p>`;
        }


        // --- Event Listener para el formulario de búsqueda ---
        searchForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const searchTerm = productSearchInput.value.trim();
            if (!searchTerm) return;
            
            // Verificación de la API Key
            if (apiKey === "AQUÍ_VA_TU_API_KEY" || !apiKey) {
                displayError("Error: Por favor, configura tu API key en la variable 'apiKey' dentro del archivo HTML.");
                return;
            }

            showLoader();
            
            const prompt = `Busca en internet precios para el producto "${searchTerm}" que se vendan en Argentina. Devuelve una lista de resultados.`;

            try {
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
                    displayResults(products);
                } else {
                    throw new Error("No se pudo obtener una respuesta válida del modelo.");
                }

            } catch (error) {
                console.error('Error al buscar precios:', error);
                displayError('Ocurrió un error al buscar los precios. Por favor, intenta de nuevo.');
            }
        });