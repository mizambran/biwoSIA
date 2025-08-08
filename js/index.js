// --- Referencias a los elementos del DOM ---
        const searchForm = document.getElementById('search-form');
        const productSearchInput = document.getElementById('product-search');
        const resultsContainer = document.getElementById('results-container');

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
            
            showLoader();
            
            // Lógica para reintentos con exponential backoff
            const maxRetries = 3;
            let currentRetry = 0;
            const apiUrl = `/api/search`; // Nuevo endpoint de la función de Netlify

            while (currentRetry < maxRetries) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ searchTerm }) // Envía solo el término de búsqueda
                    });
                    
                    if (!response.ok) {
                        if (response.status === 429) { // Demasiadas solicitudes
                            currentRetry++;
                            const delay = Math.pow(2, currentRetry) * 1000;
                            console.log(`Rate limit exceeded. Retrying in ${delay}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        } else {
                            throw new Error(`Error en la API: ${response.statusText}`);
                        }
                    }

                    const result = await response.json();
                    
                    if (result.products) {
                        displayResults(result.products);
                        return; // Salir del bucle si es exitoso
                    } else {
                        throw new Error("No se pudo obtener una respuesta válida del modelo.");
                    }

                } catch (error) {
                    console.error('Error al buscar precios:', error);
                    currentRetry++;
                    if (currentRetry >= maxRetries) {
                        displayError('Ocurrió un error al buscar los precios. Por favor, intenta de nuevo.');
                        return;
                    }
                }
            }
        });