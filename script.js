// Add this function at the beginning of your script.js file (before your event listeners)
window.showSection = function(section) {
    // Hide main menu
    document.querySelector('.main-menu').style.display = 'none';
    
    // Hide all sections first
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    // Show selected section
    document.getElementById(section + 'Section').style.display = 'block';
}

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJzL6sk0pDZtC-jtbpLNNR1dlQ94D9ccA",
    authDomain: "mea2024-d8f25.firebaseapp.com", 
    databaseURL: "https://mea2024-d8f25-default-rtdb.firebaseio.com",
    projectId: "mea2024-d8f25",
    storageBucket: "mea2024-d8f25.firebasestorage.app",
    messagingSenderId: "770842232248",
    appId: "1:770842232248:web:bc879d9e26390389fbfb4d",
    measurementId: "G-X0FFY45JDM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const database = firebase.database();

// Database functions for credentials
async function saveCredential(credentialData) {
    try {
        await database.ref('credentials/' + credentialData.number).set({
            ...credentialData,
            timestamp: Date.now()
        });
        return true;
    } catch (error) {
        console.error("Error saving credential:", error);
        return false;
    }
}

async function getNextCredentialNumber() {
    try {
        const snapshot = await database.ref('credentials').once('value');
        const totalCredentials = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        return `${String(totalCredentials + 1).padStart(2, '0')}/DMTT/GDA/2025`;
    } catch (error) {
        console.error("Error getting next credential number:", error);
        return "01/DMTT/GDA/2025";
    }
}

// Database functions for quotations
async function saveQuotation(quotationData) {
    try {
        await database.ref('quotations/' + quotationData.number).set({
            ...quotationData,
            timestamp: Date.now()
        });
        return true;
    } catch (error) {
        console.error("Error saving quotation:", error);
        return false;
    }
}

async function getNextQuotationNumber() {
    try {
        const snapshot = await database.ref('quotations').once('value');
        const totalQuotations = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        return `${String(totalQuotations + 1).padStart(2, '0')}/COT/DMTT/GDA/${new Date().getFullYear()}`;
    } catch (error) {
        console.error("Error getting next quotation number:", error);
        return `01/COT/DMTT/GDA/${new Date().getFullYear()}`;
    }
}

// Quotation functionality
let quotationCounter = 1;
let credentialCounter = 1;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize quotation number
    const quotationNumber = await getNextQuotationNumber();
    document.getElementById('quotationNumber').value = quotationNumber;

    // Add vehicle entry
    document.getElementById('addVehicle')?.addEventListener('click', () => {
        const vehicleEntries = document.getElementById('vehicleEntries');
        const newEntry = document.createElement('div');
        newEntry.className = 'entry';
        newEntry.innerHTML = `
            <input type="text" placeholder="Matrícula" required>
            <input type="number" placeholder="Peso Bruto" required>
            <input type="text" placeholder="Período de Circulação" required>
            <input type="number" placeholder="Valor" required>
            <input type="text" placeholder="Duração" required>
            <span class="total">0.00 MT</span>
        `;
        vehicleEntries.appendChild(newEntry);
    });

    // Calculate totals
    document.getElementById('quotationForm')?.addEventListener('input', calculateTotals);
    
    // Form submission
    document.getElementById('quotationForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const quotationNumber = await getNextQuotationNumber();
        const companyName = document.getElementById('companyName').value;
        const hours = parseFloat(document.getElementById('serviceHours').value);
        const ratePerHour = parseFloat(document.getElementById('ratePerHour').value);
        const total = hours * ratePerHour;
        
        const now = new Date();
        const today = now.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const quotationHTML = `
            <div class="credential-content">
                <header>
                    <img src="CMM.png" alt="Logo" class="logo">
                    <h1>CONSELHO MUNICIPAL</h1>
                    <h1>MUNICÍPIO DE MAPUTO</h1>
                    <h2>DIRECÇÃO MUNICIPAL DOS TRANSPORTES E TRÂNSITO</h2>
                    <h2>DEPARTAMENTO DE ADMINISTRAÇÃO, RECURSOS HUMANOS E FINANÇAS</h2>
                    <h3>NUIT: 500002808</h3>
                </header>

                <div class="quotation-body">
                    <p>Exmo. Senhor</p>
                    <p>${companyName}</p>
                    <p>COTAÇÃO Nº ${quotationNumber}</p>
                    
                    <table>
                        <tr>
                            <th>Descrição</th>
                            <th>Horas</th>
                            <th>Taxa Por Hora</th>
                            <th>Importância</th>
                        </tr>
                        <tr>
                            <td>Interrupção de Via</td>
                            <td>${hours.toFixed(2)}</td>
                            <td>${ratePerHour.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                            <td>${total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </table>

                    <div class="bank-details">
                        <p>Banco: Standard Bank    Nº de conta:</p>
                        <p>1084209131008</p>
                        <p>BIM NIB: 0001-0501-0000000273624</p>
                        <p>Total: ${total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
                        <p>São: ${numberToWords(total)} Meticais</p>
                    </div>

                    <div class="signature-section">
                        <p>Maputo aos ${today}</p>
                        <p>O Chefe da Secretaria</p>
                        <div class="signature-space"></div>
                        <p>José Chiau</p>
                        <p>(Técnico superior N1)</p>
                    </div>
                </div>
            </div>
        `;

        // Save to Firebase
        await saveQuotation({
            number: quotationNumber,
            companyName,
            hours,
            ratePerHour,
            total,
            date: now.toISOString()
        });

        document.getElementById('quotationPreview').innerHTML = quotationHTML;
        document.getElementById('quotationPreview').style.display = 'block';
        document.getElementById('quotationForm').style.display = 'none';
        document.querySelector('.preview-controls').style.display = 'block';
    });

    const form = document.getElementById('credentialForm');
    const addTruckBtn = document.getElementById('addTruck');
    const truckEntries = document.getElementById('truckEntries');
    const preview = document.getElementById('credentialPreview');
    const previewControls = document.querySelector('.preview-controls');
    const editButton = document.getElementById('editButton');
    const printButton = document.getElementById('printButton');
    let truckCount = 1;

    // Add new truck entry
    addTruckBtn.addEventListener('click', () => {
        truckCount++;
        const newEntry = document.createElement('div');
        newEntry.className = 'truck-entry';
        newEntry.innerHTML = `
            <h3>Camião ${truckCount}</h3>
            <div class="form-group">
                <label>Matrícula:</label>
                <input type="text" name="plate" required>
            </div>
            <div class="form-group">
                <label>Marca:</label>
                <input type="text" name="brand" required>
            </div>
            <div class="form-group">
                <label>Peso:</label>
                <input type="number" name="weight" required>
            </div>
            <div class="form-group">
                <label>Valor pago:</label>
                <input type="text" name="price" required>
            </div>
            <div class="form-group">
                <label>Período:</label>
                <input type="text" name="period" value="1 dia" required>
            </div>
        `;
        truckEntries.appendChild(newEntry);
    });

    // Update credential form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get next credential number from database
        const credentialNumber = await getNextCredentialNumber();
        
        // Collect form data and save to database
        const credentialData = {
            number: credentialNumber,
            trucks: [], 
            depositNumber: document.getElementById('depositNumber').value,
            date: new Date().toISOString()
        };
        
        // Collect truck data
        const trucks = [];
        document.querySelectorAll('.truck-entry').forEach((entry, index) => {
            // Format price to include MT currency
            const rawPrice = entry.querySelector('[name="price"]').value;
            const formattedPrice = parseFloat(rawPrice)
                .toLocaleString('pt-PT', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                }) + ' MT';

            trucks.push({
                item: index + 1,
                plate: entry.querySelector('[name="plate"]').value,
                brand: entry.querySelector('[name="brand"]').value,
                weight: entry.querySelector('[name="weight"]').value + ' Kg',
                price: formattedPrice,
                period: entry.querySelector('[name="period"]').value
            });
        });
        
        credentialData.trucks = trucks;
        
        await saveCredential(credentialData);
        
        // Continue with existing preview generation code
        // Get current date and time
        const now = new Date();
        const today = now.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const currentTime = now.toLocaleTimeString('pt-PT');

        // Update the table generation in credentialHTML
        const tableRows = trucks.map(truck => `
            <tr>
                <td>${truck.item}</td>
                <td>${truck.plate}</td>
                <td>${truck.brand}</td>
                <td>${truck.weight}</td>
                <td>${truck.price}</td>
                <td>${truck.period}</td>
            </tr>
        `).join('');

        const credentialHTML = `
            <div class="credential-content">
                <img src="watermark.png" alt="" class="watermark">
                <header>
                    <img src="CMM.png" alt="Município de Maputo Logo" class="logo">
                    <h1>MUNICÍPIO DE MAPUTO</h1>
                    <h2>CONSELHO MUNICIPAL</h2>
                    <h3>PELOURO DE MOBILIDADE, TRANSPORTES E TRÂNSITO</h3>
                    <h3>DIRECÇÃO MUNICIPAL DE MOBILIDADE, TRANSPORTES E TRÂNSITO</h3>
                </header>

                <div class="credential-info">
                    <p><strong>Credencial nº ${credentialNumber}</strong></p>
                    <p><strong>Data:</strong> ${today}</p>
                    <p class="subject-line"><strong>Assunto:</strong> Autorização para Circulação de ${trucks.length} ${trucks.length > 1 ? 'Camiões' : 'Camião'} por um dia.</p>
                </div>

                <div class="deposit-info">
                    <p><strong>Talão de Deposito:</strong> Nº ${document.getElementById('depositNumber').value}</p>
                </div>

                <div class="main-content">
                    <p>No tocante ao assunto em epigrafe, e devido a oscilação de sistema para o licenciamento, na Direcção Municipal de Mobilidade, Transportes e Trânsito para assegurar o pagamento e obtenção do recibo, serve a presente para autorizar excepcionalmente a circulação do${trucks.length > 1 ? 's' : ''} Camião${trucks.length > 1 ? 'ões' : ''} constantes da tabela abaixo:</p>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Matricula</th>
                                <th>Marca</th>
                                <th>Peso</th>
                                <th>Valor pago</th>
                                <th>Período</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>

                    <p>Por ser verdade, passou se a presente credencial válida em original assinada e carimbada com o carimbo a tinta de óleo em uso nesta unidade orgânica junto anexo a cópia do Talão de deposito.</p>

                    <p class="contact-info">Em caso de omissão ou alguma informação adicional, pode-se contactar o Senhor Nelson Gustavo Massango, Director de Mobilidade, Transporte e Trânsito através dos números:+258 873824101 ou +258 846276491.</p>

                    <div class="signature-section">
                        <p>Maputo, ${today}</p>
                        <p class="signature-title">A Directora Adjunta</p>
                        <p>Ruchia José Maria Salvador Cuncha</p>
                        <p>/Téc.Sup.TICs/</p>
                    </div>
                </div>

                <footer>
                    <p class="computer-info">Produzido por computador - ${today} ${currentTime}</p>
                </footer>
            </div>
        `;

        // Show preview and controls
        preview.innerHTML = credentialHTML;
        preview.style.display = 'block';
        previewControls.style.display = 'block';
        form.style.display = 'none';
    });

    // Edit button functionality
    editButton.addEventListener('click', () => {
        preview.style.display = 'none';
        previewControls.style.display = 'none';
        form.style.display = 'block';
    });

    // Print button functionality
    printButton.addEventListener('click', () => {
        window.print();
    });

    // Update reports functionality to fetch from database
    async function generateReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        try {
            const credentialsSnapshot = await database.ref('credentials').once('value');
            const quotationsSnapshot = await database.ref('quotations').once('value');
            
            // Process and display report data
            const reportData = {
                credentials: credentialsSnapshot.val() || {},
                quotations: quotationsSnapshot.val() || {}
            };
            
            // Filter by date range and update UI
            console.log(reportData);
            
        } catch (error) {
            console.error("Error generating report:", error);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('quotationForm');
    if (form) {
        form.addEventListener('input', (e) => {
            if (['serviceHours', 'ratePerHour'].includes(e.target.id)) {
                const hours = parseFloat(document.getElementById('serviceHours').value) || 0;
                const rate = parseFloat(document.getElementById('ratePerHour').value) || 0;
                const total = hours * rate;
                document.getElementById('totalAmount').value = total.toLocaleString('pt-PT', { minimumFractionDigits: 2 });
            }
        });
    }
});

function calculateTotals() {
    // Implementation for calculating totals and updating amount in words
}

// Reports functionality
function showReport(type) {
    // Implementation for showing different report types
}

function downloadReport() {
    // Implementation for downloading reports
}

// Number to words conversion (Portuguese)
function numberToWords(num) {
    // Implementation for converting numbers to words in Portuguese
}
