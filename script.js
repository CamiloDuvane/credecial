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

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();
    const database = firebase.database();
    const auth = firebase.auth();

    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const appContent = document.getElementById('appContent');
    const loginSection = document.getElementById('loginSection');
    const loading = document.getElementById('loading');

    // Prevent direct access to app content
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginSection.style.display = 'none';
            appContent.style.display = 'block';
        } else {
            loginSection.style.display = 'block';
            appContent.style.display = 'none';
        }
        loading.style.display = 'none';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loading.style.display = 'block';
        loginError.textContent = '';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            loginError.textContent = 'Email ou senha incorretos';
            loading.style.display = 'none';
        }
    });

    // Helper functions
    window.showSection = function(section) {
        document.querySelector('.main-menu').style.display = 'none';
        document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
        document.getElementById(section + 'Section').style.display = 'block';
    };

    window.showQuotationType = function(type) {
        const quotationTypeSelection = document.getElementById('quotationTypeSelection');
        const interruptionForm = document.getElementById('interruption-form');
        const trucksForm = document.getElementById('trucks-form');
        
        if (quotationTypeSelection) quotationTypeSelection.style.display = 'none';
        if (interruptionForm) interruptionForm.style.display = type === 'interruption' ? 'block' : 'none';
        if (trucksForm) trucksForm.style.display = type === 'trucks' ? 'block' : 'none';
    };

    window.goBack = function(section) {
        if (section === 'quotation') {
            const interruptionForm = document.getElementById('interruption-form');
            const trucksForm = document.getElementById('trucks-form');
            const quotationTypeSelection = document.getElementById('quotationTypeSelection');
            const quotationPreview = document.getElementById('quotationPreview');
            
            if (interruptionForm) interruptionForm.style.display = 'none';
            if (trucksForm) trucksForm.style.display = 'none';
            if (quotationTypeSelection) quotationTypeSelection.style.display = 'block';
            if (quotationPreview) quotationPreview.style.display = 'none';
        } else {
            const sections = document.querySelectorAll('.section');
            const mainMenu = document.querySelector('.main-menu');
            
            if (sections) sections.forEach(s => s.style.display = 'none');
            if (mainMenu) mainMenu.style.display = 'block';
        }
    };

    window.showReport = function(type) {
        // Hide all report content first
        document.querySelectorAll('.report-content > div').forEach(div => {
            div.style.display = 'none';
        });

        // Show selected report type
        const reportContent = document.getElementById(`${type}Report`);
        if (reportContent) {
            reportContent.style.display = 'block';
        }

        // Update active tab styling
        document.querySelectorAll('.report-tabs button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`.report-tabs button[onclick*="${type}"]`).classList.add('active');
    };

    window.logout = function() {
        firebase.auth().signOut();
    };

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

    async function getNextQuotationNumber(type) {
        try {
            const year = new Date().getFullYear();
            const snapshot = await database.ref(`quotations/${year}`).once('value');
            const quotations = snapshot.val() || {};
            const count = Object.keys(quotations).length + 1;
            const prefix = type === 'interruption' ? 'INT' : 'CAM';
            return `${String(count).padStart(2, '0')}/${prefix}/DMTT/GDA/${year}`;
        } catch (error) {
            console.error("Error getting next quotation number:", error);
            return `01/${type === 'interruption' ? 'INT' : 'CAM'}/DMTT/GDA/${new Date().getFullYear()}`;
        }
    }

    // Initialize form event listeners
    const interruptionForm = document.getElementById('interruption-form');
    const trucksForm = document.getElementById('trucks-form');

    if (interruptionForm) {
        interruptionForm.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const quotationNumber = await getNextQuotationNumber('interruption');
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

            const quotationData = {
                type: 'interruption',
                number: quotationNumber,
                companyName,
                hours,
                ratePerHour,
                total,
                date: now.toISOString(),
                createdBy: auth.currentUser.email
            };

            await saveQuotation(quotationData);
            
            const quotationHTML = `
                <div class="credential-content">
                    <header>
                        <img src="logo.png" alt="Logo" class="logo">
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

            document.getElementById('quotationPreview').innerHTML = quotationHTML;
            document.getElementById('quotationPreview').style.display = 'block';
            document.getElementById('quotationTypeSelection').style.display = 'none';
            document.getElementById('interruption-form').style.display = 'none';
            document.querySelector('.preview-controls').style.display = 'block';
        });
    }

    if (trucksForm) {
        trucksForm.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const quotationNumber = await getNextQuotationNumber('trucks');
            const companyName = document.getElementById('truckCompanyName').value;
            const vehicles = [];
            
            document.querySelectorAll('.vehicle-entry').forEach(entry => {
                vehicles.push({
                    plate: entry.querySelector('[name="plate"]').value,
                    weight: entry.querySelector('[name="weight"]').value,
                    period: entry.querySelector('[name="period"]').value,
                    rate: parseFloat(entry.querySelector('[name="rate"]').value),
                    duration: parseInt(entry.querySelector('[name="duration"]').value),
                    total: parseFloat(entry.querySelector('.total').textContent)
                });
            });

            const total = vehicles.reduce((sum, vehicle) => sum + vehicle.total, 0);
            
            const quotationData = {
                type: 'trucks',
                number: quotationNumber,
                companyName,
                vehicles,
                total,
                date: new Date().toISOString(),
                createdBy: auth.currentUser.email
            };

            await saveQuotation(quotationData);
            
            const quotationHTML = `
                <div class="credential-content">
                    <header>
                        <img src="logo.png" alt="Logo" class="logo">
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
                                <td>Aluguer de Camiões</td>
                                <td>${vehicles.length}</td>
                                <td>${total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
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
                            <p>Maputo aos ${new Date().toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            })}</p>
                            <p>O Chefe da Secretaria</p>
                            <div class="signature-space"></div>
                            <p>José Chiau</p>
                            <p>(Técnico superior N1)</p>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('quotationPreview').innerHTML = quotationHTML;
            document.getElementById('quotationPreview').style.display = 'block';
            document.getElementById('quotationTypeSelection').style.display = 'none';
            document.getElementById('trucks-form').style.display = 'none';
            document.querySelector('.preview-controls').style.display = 'block';
        });
    }

    // Initialize quotation form calculation
    const quotationForm = document.getElementById('quotationForm');
    if (quotationForm) {
        quotationForm.addEventListener('input', (e) => {
            if (['serviceHours', 'ratePerHour'].includes(e.target.id)) {
                const hours = parseFloat(document.getElementById('serviceHours').value) || 0;
                const rate = parseFloat(document.getElementById('ratePerHour').value) || 0;
                const total = hours * rate;
                const totalAmount = document.getElementById('totalAmount');
                if (totalAmount) {
                    totalAmount.value = total.toLocaleString('pt-PT', { minimumFractionDigits: 2 });
                }
            }
        });
    }

    // Initialize vehicle entries
    const addVehicleBtn = document.getElementById('addVehicle');
    if (addVehicleBtn) {
        addVehicleBtn.addEventListener('click', () => {
            const vehicleEntries = document.getElementById('vehicleEntries');
            if (vehicleEntries) {
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
            }
        });
    }

    // Initialize credential form
    const credentialForm = document.getElementById('credentialForm');
    if (credentialForm) {
        credentialForm.addEventListener('submit', async (e) => {
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
                        <img src="logo.png" alt="Município de Maputo Logo" class="logo">
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
            const preview = document.getElementById('credentialPreview');
            const previewControls = document.querySelector('.preview-controls');
            const editButton = document.getElementById('editButton');
            const printButton = document.getElementById('printButton');
            if (preview) preview.innerHTML = credentialHTML;
            if (preview) preview.style.display = 'block';
            if (previewControls) previewControls.style.display = 'block';
            if (credentialForm) credentialForm.style.display = 'none';

            // Edit button functionality
            if (editButton) {
                editButton.addEventListener('click', () => {
                    if (preview) preview.style.display = 'none';
                    if (previewControls) previewControls.style.display = 'none';
                    if (credentialForm) credentialForm.style.display = 'block';
                });
            }

            // Print button functionality
            if (printButton) {
                printButton.addEventListener('click', () => {
                    window.print();
                });
            }
        });
    }

    // Initialize add truck button
    const addTruckBtn = document.getElementById('addTruck');
    if (addTruckBtn) {
        addTruckBtn.addEventListener('click', () => {
            const truckEntries = document.getElementById('truckEntries');
            if (truckEntries) {
                const newEntry = document.createElement('div');
                newEntry.className = 'truck-entry';
                newEntry.innerHTML = `
                    <h3>Camião ${document.querySelectorAll('.truck-entry').length + 1}</h3>
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
            }
        });
    }

    // Add/update the generateReport function in global scope
    window.generateReport = async function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            alert('Por favor selecione as datas inicial e final');
            return;
        }

        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // Include full end date

        try {
            const credentialsSnapshot = await database.ref('credentials').once('value');
            const quotationsSnapshot = await database.ref('quotations').once('value');
            
            const credentials = credentialsSnapshot.val() || {};
            const quotations = quotationsSnapshot.val() || {};

            // Filter credentials by date
            const filteredCredentials = Object.entries(credentials)
                .filter(([_, data]) => {
                    const timestamp = data.timestamp;
                    return timestamp >= startTimestamp && timestamp <= endTimestamp;
                })
                .reduce((acc, [key, value]) => ({...acc, [key]: value}), {});

            // Filter quotations by date
            const filteredQuotations = Object.entries(quotations)
                .filter(([_, data]) => {
                    const timestamp = data.timestamp;
                    return timestamp >= startTimestamp && timestamp <= endTimestamp;
                })
                .reduce((acc, [key, value]) => ({...acc, [key]: value}), {});

            // Update credentials report
            const credentialsReport = document.getElementById('credentialsResults');
            if (credentialsReport) {
                credentialsReport.innerHTML = `
                    <h4>Período: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Data</th>
                                <th>Total de Camiões</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(filteredCredentials).map(([number, data]) => `
                                <tr>
                                    <td>${number}</td>
                                    <td>${new Date(data.timestamp).toLocaleDateString()}</td>
                                    <td>${data.trucks ? data.trucks.length : 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p>Total de Credenciais: ${Object.keys(filteredCredentials).length}</p>
                `;
            }

            // Update quotations report
            const quotationsReport = document.getElementById('quotationsResults');
            if (quotationsReport) {
                quotationsReport.innerHTML = `
                    <h4>Período: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Data</th>
                                <th>Empresa</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(filteredQuotations).map(([number, data]) => `
                                <tr>
                                    <td>${number}</td>
                                    <td>${new Date(data.timestamp).toLocaleDateString()}</td>
                                    <td>${data.companyName}</td>
                                    <td>${data.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p>Total de Cotações: ${Object.keys(filteredQuotations).length}</p>
                `;
            }

        } catch (error) {
            console.error("Error generating report:", error);
            alert('Erro ao gerar relatório. Por favor tente novamente.');
        }
    };

    // Add/update the downloadReport function in global scope
    window.downloadReport = function() {
        const reportContent = document.querySelector('.report-content').innerHTML;
        const blob = new Blob([`
            <html>
                <head>
                    <style>
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid black; padding: 8px; text-align: left; }
                        h4 { margin: 20px 0; }
                    </style>
                </head>
                <body>
                    ${reportContent}
                </body>
            </html>
        `], {type: 'text/html'});
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${new Date().toISOString().split('T')[0]}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

});