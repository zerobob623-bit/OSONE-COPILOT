// Estrutura inicial para chamadas de API
export const apiConfig = {
    baseUrl: process.env.VITE_API_URL || 'http://localhost:3000',
    timeout: 5000,
};

// Exemplo de função de busca
export const fetchData = async (endpoint: string) => {
    try {
        const response = await fetch(`${apiConfig.baseUrl}/${endpoint}`);
        return await response.json();
    } catch (error) {
        console.error("Erro na chamada da API:", error);
    }
};
