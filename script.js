// --- CONFIGURATION GLOBALE ---
const APP_NAME = "ANTARA-VPN";
let isConnected = false;
let selectedServer = null;
let statsInterval;

// Liste des serveurs simulés
const servers = [
    { id: 'us1', name: 'USA New York', flag: '🇺🇸', ping: 45 },
    { id: 'uk1', name: 'UK London', flag: '🇬🇧', ping: 80 },
    { id: 'fr1', name: 'France Paris', flag: '🇫🇷', ping: 20 },
    { id: 'de1', name: 'Germany Berlin', flag: '🇩🇪', ping: 50 },
    { id: 'jp1', name: 'Japan Tokyo', flag: '🇯🇵', ping: 120 },
    { id: 'cam1', name: 'Cameroon Douala', flag: '🇨🇲', ping: 15 } // Cameroukian touch!
];

// --- INITIALISATION ---
window.onload = function() {
    generateHWID();
    renderServers();
    loadSettings();
};

// --- GESTION DES ONGLETS ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

// --- LOGIQUE VPN ---
function toggleConnection() {
    const btn = document.getElementById('mainConnectBtn');
    const circle = document.getElementById('vpnCircle');
    
    if (!isConnected) {
        if (!selectedServer) {
            alert("Veuillez sélectionner un serveur d'abord !");
            return;
        }
        
        // Simulation connexion
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
        setTimeout(() => {
            isConnected = true;
            updateUI(true);
            startStats();
        }, 1500);
    } else {
        isConnected = false;
        updateUI(false);
        stopStats();
    }
}

function updateUI(status) {
    const body = document.body;
    const btn = document.getElementById('mainConnectBtn');
    const statusText = document.getElementById('statusText');
    const serverInfo = document.getElementById('serverInfo');
    const icon = document.getElementById('vpnIcon');

    if (status) {
        body.classList.add('connected');
        btn.innerHTML = "SE DÉCONNECTER";
        btn.classList.add('disconnecting');
        statusText.innerText = "Connecté";
        serverInfo.innerText = selectedServer.name + " (" + selectedServer.id + ")";
        icon.className = "fas fa-check-circle";
    } else {
        body.classList.remove('connected');
        btn.innerHTML = "SE CONNECTER";
        btn.classList.remove('disconnecting');
        statusText.innerText = "Déconnecté";
        serverInfo.innerText = selectedServer ? "Serveur: " + selectedServer.name : "Sélectionnez un serveur";
        icon.className = "fas fa-power-off";
    }
}

function selectServer(id) {
    selectedServer = servers.find(s => s.id === id);
    alert(`Serveur ${selectedServer.name} sélectionné.`);
    switchTab('connect');
}

// --- STATS SIMULÉES ---
function startStats() {
    statsInterval = setInterval(() => {
        document.getElementById('pingVal').innerText = Math.floor(Math.random() * 10) + 10 + " ms";
        document.getElementById('upVal').innerText = (Math.random() * 5).toFixed(1) + " MB/s";
        document.getElementById('downVal').innerText = (Math.random() * 50 + 20).toFixed(1) + " MB/s";
    }, 1000);
}

function stopStats() {
    clearInterval(statsInterval);
    document.getElementById('pingVal').innerText = "-- ms";
    document.getElementById('upVal').innerText = "0 KB/s";
    document.getElementById('downVal').innerText = "0 KB/s";
}

// --- RENDER SERVERS ---
function renderServers() {
    const container = document.getElementById('serverListContainer');
    container.innerHTML = '';
    
    servers.forEach(server => {
        const div = document.createElement('div');
        div.className = 'server-item';
        div.onclick = () => selectServer(server.id);
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <span class="server-flag">${server.flag}</span>
                <div>
                    <strong>${server.name}</strong><br>
                    <small style="color:#666">ID: ${server.id}</small>
                </div>
            </div>
            <span class="${server.ping < 50 ? 'ping-low' : 'ping-high'}">${server.ping} ms</span>
        `;
        container.appendChild(div);
    });
}

// --- HWID SYSTEM ---
function generateHWID() {
    // Simule un ID basé sur l'user agent ou une hash locale
    const userAgent = navigator.userAgent;
    const timestamp = Date.now();
    const hwid = "ANT-" + btoa(userAgent + timestamp).substring(0, 12);
    
    document.getElementById('hwidCode').innerText = hwid;
    document.getElementById('hwidDisplay').innerText = "HWID: " + hwid;
}

function copyHwid() {
    const hwid = document.getElementById('hwidCode').innerText;
    navigator.clipboard.writeText(hwid);
    alert("HWID copié !");
}

// --- IMPORT / EXPORT CONFIG (.ATRS) ---
function exportConfig() {
    const config = {
        version: "1.0",
        hwid: document.getElementById('hwidCode').innerText,
        settings: {
            protocol: document.getElementById('protocolSelect').value,
            killSwitch: document.getElementById('killSwitch').checked,
            dns: document.getElementById('dnsFilter').checked,
            autoConnect: document.getElementById('autoConnect').checked
        },
        lastServer: selectedServer ? selectedServer.id : null
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "antara_config.atrs");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importConfig(input) {
    const file = input.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            // Appliquer les configs
            document.getElementById('protocolSelect').value = config.settings.protocol || 'wireguard';
            document.getElementById('killSwitch').checked = config.settings.killSwitch;
            document.getElementById('dnsFilter').checked = config.settings.dns;
            
            if(config.lastServer) {
                selectedServer = servers.find(s => s.id === config.lastServer);
            }
            alert("Configuration importée avec succès !");
        } catch (err) {
            alert("Erreur fichier .atrs invalide.");
        }
    };
    reader.readAsText(file);
}

// --- HOSTS FILE ---
function applyHosts() {
    const hosts = document.getElementById('manualHosts').value;
    console.log("Hosts applied:", hosts);
    alert("Fichier hosts mis à jour ! Redémarrage du service DNS...");
}

function enableAutoServer() {
    if(document.getElementById('autoServer').checked) {
        alert("Auto-Server activé : Vous serez connecté au serveur le plus rapide disponible.");
        // Logique réelle : trier les serveurs par ping et choisir le meilleur
    }
}