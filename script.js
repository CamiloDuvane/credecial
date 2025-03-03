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

    // Login form handler
    if (loginForm) {
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
    }

    // Helper functions
    window.showSection = function(section) {
        document.querySelector('.main-menu').style.display = 'none';
        document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
        const sectionElement = document.getElementById(section + 'Section');
        if (sectionElement) {
            sectionElement.style.display = 'block';
        }
    };

    window.showQuotationType = function(type) {
        const quotationTypeSelection = document.getElementById('quotationTypeSelection');
        const interruptionForm = document.getElementById('interruption-form');
        const trucksForm = document.getElementById('trucks-form');
        
        if (quotationTypeSelection) quotationTypeSelection.style.display = 'none';
        if (interruptionForm) interruptionForm.style.display = type === 'interruption' ? 'block' : 'none';
        if (trucksForm) trucksForm.style.display = type === 'trucks' ? 'block' : 'none';
    };

    window.showReport = function(type) {
        // Hide all report content first
        document.querySelectorAll('.report-content > div').forEach(div => {
            div.style.display = 'none';
        });

        // Show selected report type
        const reportElement = document.getElementById(`${type}Report`);
        if (reportElement) {
            reportElement.style.display = 'block';
        }

        // Update active tab styling
        document.querySelectorAll('.report-tabs button').forEach(button => {
            button.classList.remove('active');
        });
        const activeButton = document.querySelector(`.report-tabs button[onclick*="${type}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
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

    window.logout = function() {
        if (auth) {
            auth.signOut();
        }
    };

    // Add weight-based rate mapping
    const weightRates = {
        "3500 Kg": {
            "24h": 1000,
            "night": 800
        },
        "7500 Kg": {
            "24h": 2000,
            "night": 1600
        }, 
        "16000 Kg": {
            "24h": 3000,
            "night": 2400
        },
        "30000 Kg": {
            "24h": 4000,
            "night": 3200
        },
        "40000 Kg": {
            "24h": 5000,
            "night": 4000
        }
    };

    // Improve vehicle entry handling
    window.updateRate = function(weightSelect) {
        const entry = weightSelect.closest('.entry');
        const weight = weightSelect.value;
        const period = entry.querySelector('[name="period"]').value;
        let rateInput = entry.querySelector('[name="rate"]');
        
        if (weight && period && weightRates[weight] && weightRates[weight][period]) {
            rateInput.value = weightRates[weight][period];
            calculateTotal(entry);
        }
    };

    window.calculateTotal = function(entry) {
        const rateInput = entry.querySelector('[name="rate"]');
        const durationInput = entry.querySelector('[name="duration"]');
        const totalSpan = entry.querySelector('.total');
        
        const rate = parseFloat(rateInput.value) || 0;
        let duration = parseFloat(durationInput.value) || 0;
        
        // Ensure duration is between 1 and 12
        duration = Math.max(1, Math.min(12, duration));
        durationInput.value = duration;
        
        const total = rate * duration;
        totalSpan.textContent = total.toLocaleString('pt-PT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' MT';
    };

    // Initialize trucks form
    const trucksForm = document.getElementById('trucks-form');
    if (trucksForm) {
        const form = trucksForm.querySelector('form');
        
        // Initialize first vehicle entry
        const firstEntry = document.querySelector('#vehicleEntries .entry');
        if (firstEntry) {
            firstEntry.innerHTML = `
                <input type="text" name="plate" placeholder="Matrícula" required>
                <select name="weight" required onchange="updateRate(this)">
                    <option value="">Selecione o peso</option>
                    ${Object.keys(weightRates).map(weight => 
                        `<option value="${weight}">${weight}</option>`
                    ).join('')}
                </select>
                <select name="period" required onchange="updateRate(this.parentElement.querySelector('[name=weight]'))">
                    <option value="">Selecione o período</option>
                    <option value="24h">24 Horas</option>
                    <option value="night">Noturno</option>
                </select>
                <input type="number" name="rate" placeholder="Taxa Mensal" readonly>
                <input type="number" name="duration" placeholder="Duração (meses)" min="1" max="12" onchange="calculateTotal(this.parentElement)" required>
                <span class="total">0.00 MT</span>
            `;
        }

        // Add vehicle button handling
        const addVehicleBtn = document.getElementById('addVehicle');
        if (addVehicleBtn) {
            addVehicleBtn.addEventListener('click', () => {
                const entry = document.createElement('div');
                entry.className = 'entry';
                entry.innerHTML = firstEntry.innerHTML;
                document.getElementById('vehicleEntries').appendChild(entry);
            });
        }

        // Form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const quotationNumber = await getNextQuotationNumber('trucks');
                const companyName = form.querySelector('[type="text"]').value;
                const vehicles = [];
                
                form.querySelectorAll('.entry').forEach(entry => {
                    const rate = parseFloat(entry.querySelector('[name="rate"]').value);
                    const duration = parseInt(entry.querySelector('[name="duration"]').value);
                    vehicles.push({
                        plate: entry.querySelector('[name="plate"]').value,
                        weight: entry.querySelector('[name="weight"]').value,
                        period: entry.querySelector('[name="period"]').value,
                        rate: rate,
                        duration: duration,
                        total: rate * duration
                    });
                });

                const totalAmount = vehicles.reduce((sum, vehicle) => sum + vehicle.total, 0);
                
                const quotationData = {
                    number: quotationNumber,
                    type: 'trucks',
                    companyName,
                    vehicles,
                    total: totalAmount,
                    timestamp: Date.now()
                };
                
                await saveQuotation(quotationData);
                
                const quotationHTML = generateTrucksQuotationHTML(
                    quotationNumber,
                    companyName,
                    vehicles,
                    totalAmount
                );
                
                document.getElementById('quotationPreview').innerHTML = quotationHTML;
                document.getElementById('quotationPreview').style.display = 'block';
                document.getElementById('trucks-form').style.display = 'none';
                document.querySelector('.preview-controls').style.display = 'flex';
            });
        }
    }

    // Interruption form handling
    const interruptionForm = document.getElementById('interruption-form');
    if (interruptionForm) {
        const form = interruptionForm.querySelector('form');
        const serviceHours = document.getElementById('serviceHours');
        const ratePerHour = document.getElementById('ratePerHour');
        const totalAmount = document.getElementById('totalAmount');

        // Calculate total on input change
        const calculateInterruptionTotal = () => {
            const hours = parseFloat(serviceHours.value) || 0;
            const rate = parseFloat(ratePerHour.value) || 0;
            const total = hours * rate;
            totalAmount.value = total.toLocaleString('pt-PT', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + ' MT';
        };

        if (serviceHours && ratePerHour) {
            serviceHours.addEventListener('input', calculateInterruptionTotal);
            ratePerHour.addEventListener('input', calculateInterruptionTotal);
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const quotationNumber = await getNextQuotationNumber('interruption');
                const companyName = document.getElementById('companyName').value;
                const hours = parseFloat(serviceHours.value);
                const rate = parseFloat(ratePerHour.value);
                const total = hours * rate;
                
                const quotationData = {
                    number: quotationNumber,
                    type: 'interruption',
                    companyName,
                    hours,
                    ratePerHour: rate,
                    total,
                    timestamp: Date.now()
                };
                
                await saveQuotation(quotationData);
                
                const quotationHTML = generateInterruptionQuotationHTML(
                    quotationNumber,
                    companyName,
                    hours,
                    rate,
                    total
                );
                
                document.getElementById('quotationPreview').innerHTML = quotationHTML;
                document.getElementById('quotationPreview').style.display = 'block';
                document.getElementById('interruption-form').style.display = 'none';
                document.querySelector('.preview-controls').style.display = 'flex';
            });
        }
    }

    // Helper function to generate interruption quotation HTML
    function generateInterruptionQuotationHTML(number, company, hours, rate, total) {
        const today = new Date().toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        return `
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
                    <p>${company}</p>
                    <p>COTAÇÃO Nº ${number}</p>
                    
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
                            <td>${rate.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                            <td>${total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </table>

                    <div class="bank-details">
                        <p>Banco: Standard Bank    Nº de conta:</p>
                        <p>1084209131008</p>
                        <p>BIM NIB: 0001-0501-0000000273624</p>
                        <p>Total: ${total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</p>
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
    }

    // Helper function to generate trucks quotation HTML
    function generateTrucksQuotationHTML(number, company, vehicles, total) {
        const today = new Date().toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const vehicleRows = vehicles.map(vehicle => `
            <tr>
                <td>${vehicle.plate}</td>
                <td>${vehicle.weight}</td>
                <td>${vehicle.period}</td>
                <td>${vehicle.rate.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                <td>${vehicle.duration}</td>
                <td>${vehicle.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

        return `
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
                    <p>${company}</p>
                    <p>COTAÇÃO Nº ${number}</p>
                    
                    <table>
                        <tr>
                            <th>Matrícula</th>
                            <th>Peso Bruto</th>
                            <th>Período</th>
                            <th>Taxa Mensal</th>
                            <th>Duração (meses)</th>
                            <th>Total</th>
                        </tr>
                        ${vehicleRows}
                    </table>

                    <div class="bank-details">
                        <p>Banco: Standard Bank    Nº de conta:</p>
                        <p>1084209131008</p>
                        <p>BIM NIB: 0001-0501-0000000273624</p>
                        <p>Total: ${total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</p>
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

    // Add the numberToWords function
    window.numberToWords = function(number) {
        const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const scales = ['', 'mil', 'milhão', 'bilhão'];

        function convertGroup(number) {
            let result = '';
            
            const hundreds = Math.floor(number / 100);
            const remainder = number % 100;
            const tensDigit = Math.floor(remainder / 10);
            const unitsDigit = remainder % 10;

            if (hundreds > 0) {
                if (hundreds === 1) {
                    result += 'cem';
                } else {
                    result += units[hundreds] + 'centos';
                }
                if (remainder > 0) result += ' e ';
            }

            if (remainder >= 10 && remainder < 20) {
                result += teens[remainder - 10];
            } else {
                if (tensDigit > 0) {
                    result += tens[tensDigit];
                    if (unitsDigit > 0) result += ' e ';
                }
                if (unitsDigit > 0) {
                    result += units[unitsDigit];
                }
            }

            return result;
        }

        if (number === 0) return 'zero';

        const parts = [];
        let remaining = Math.floor(number);
        let scaleIndex = 0;

        while (remaining > 0) {
            const group = remaining % 1000;
            if (group > 0) {
                const words = convertGroup(group);
                if (scaleIndex > 0) {
                    parts.unshift(words + ' ' + scales[scaleIndex] + (group > 1 && scaleIndex >= 2 ? 'ões' : ''));
                } else {
                    parts.unshift(words);
                }
            }
            remaining = Math.floor(remaining / 1000);
            scaleIndex++;
        }

        // Handle decimal part
        const decimalPart = (number - Math.floor(number)).toFixed(2).slice(2);
        let result = parts.join(' ');
        if (decimalPart !== '00') {
            result += ' e ' + decimalPart + '/100';
        }

        return result;
    };

    // Add generateReport function
    window.generateReport = async function() {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        
        if (!startDate || !endDate) {
            alert('Por favor selecione as datas inicial e final');
            return;
        }

        const year = new Date().getFullYear();
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime() + (24 * 60 * 60 * 1000);

        try {
            const credentialsSnapshot = await database.ref('credentials').once('value');
            const quotationsSnapshot = await database.ref('quotations').once('value');
            
            const credentials = [];
            const quotations = [];

            credentialsSnapshot.forEach(snap => {
                const data = snap.val();
                if (data.timestamp >= startTimestamp && data.timestamp <= endTimestamp) {
                    credentials.push(data);
                }
            });

            quotationsSnapshot.forEach(snap => {
                const data = snap.val();
                if (data.timestamp >= startTimestamp && data.timestamp <= endTimestamp) {
                    quotations.push(data);
                }
            });

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
                            ${credentials.map(data => `
                                <tr>
                                    <td>${data.number}</td>
                                    <td>${new Date(data.timestamp).toLocaleDateString()}</td>
                                    <td>${data.trucks ? data.trucks.length : 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p>Total de Credenciais: ${credentials.length}</p>
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
                                <th>Tipo</th>
                                <th>Empresa</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quotations.map(data => `
                                <tr>
                                    <td>${data.number}</td>
                                    <td>${new Date(data.timestamp).toLocaleDateString()}</td>
                                    <td>${data.type === 'interruption' ? 'Interrupção' : 'Camiões'}</td>
                                    <td>${data.companyName}</td>
                                    <td>${data.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p>Total de Cotações: ${quotations.length}</p>
                `;
            }

        } catch (error) {
            console.error("Error generating report:", error);
            alert('Erro ao gerar relatório. Por favor tente novamente.');
        }
    };

    // Add downloadReport function
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
            await database.ref('quotations').push({
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
});
