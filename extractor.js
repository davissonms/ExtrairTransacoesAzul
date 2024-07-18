// Função para extrair o texto de um elemento, garantindo que não seja null
function extractText(element) {
    return element ? element.textContent.trim() : '';
}

// Função para extrair todas as transações da página atual
function extractTransactions() {
    const transactionContainers = document.querySelectorAll('.sc-80bffd9b-0');

    if (transactionContainers.length === 0) {
        console.warn('Nenhum container de transação encontrado.');
    }

    const transactions = Array.from(transactionContainers).map(container => {
        const dateElements = container.querySelectorAll('.sc-dhKdcB, .sc-kpDqfm');
        const descriptionElement = container.querySelector('.sc-jXbUNg.dVctfE');
        const pointsElement = container.querySelector('.sc-jXbUNg.jHvALu'); // Pontos positivos
        const pointsNegElement = container.querySelector('.sc-jXbUNg.jBJnHK'); // Pontos negativos

        const transaction = {
            date: extractText(dateElements[0]),
            description: extractText(descriptionElement),
            points: extractText(pointsElement) || extractText(pointsNegElement)
        };

        return transaction;
    });

    return transactions;
}

// Função para navegar até a próxima página
function goToNextPage() {
    const nextPageButton = document.querySelector('button[aria-label="Próxima página"]');
    if (nextPageButton && !nextPageButton.disabled) {
        nextPageButton.click();
        return true;
    }
    return false;
}

// Função para esperar até que um elemento específico esteja visível
function waitForSelector(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (document.querySelector(selector)) {
                clearInterval(interval);
                resolve();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                reject(new Error(`Timeout ao esperar pelo seletor: ${selector}`));
            }
        }, 500);
    });
}

// Função para esperar um período específico
function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para converter uma lista de objetos em um CSV
function convertToCSV(transactions) {
    const headers = ['Date', 'Description', 'Points'];
    const rows = transactions.map(transaction => [
        transaction.date,
        transaction.description,
        transaction.points
    ]);

    const csvContent = [
        headers.join(','), // header row
        ...rows.map(row => row.join(',')) // data rows
    ].join('\n');

    return csvContent;
}

// Função para salvar o conteúdo CSV em um arquivo
function downloadCSV(csvContent, filename = 'transactions.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Função principal para extrair transações de todas as páginas e salvar em CSV
async function extractAndSaveTransactions() {
    let allTransactions = [];
    let hasNextPage = true;

    while (hasNextPage) {
        // Espera a página carregar e o botão de próximo estar disponível
        try {
            await waitForSelector('.sc-80bffd9b-0'); // Ajuste o seletor conforme necessário
        } catch (error) {
            console.error(error);
            break;
        }

        // Extrai as transações da página atual
        const transactions = extractTransactions();
        allTransactions = allTransactions.concat(transactions);

        // Tenta ir para a próxima página
        hasNextPage = goToNextPage();
        if (hasNextPage) {
            // Aguarda um tempo para garantir que a página mudou
            await waitFor(2000);
        }
    }

    // Converte para CSV e faz o download
    const csvContent = convertToCSV(allTransactions);
    downloadCSV(csvContent);
}

// Extrair e salvar as transações de todas as páginas em um arquivo CSV
extractAndSaveTransactions();
