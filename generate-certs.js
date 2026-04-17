const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, 'certs');

if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
}

const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('Certificates not found, generating self-signed certificates...');
    try {
        const command = `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`;
        execSync(command, { stdio: 'inherit' });
        console.log('✅ Certificates generated successfully in /certs folder.');
    } catch (err) {
        console.error('❌ Failed to generate certificates. Do you have OpenSSL installed?');
        console.error(err.message);
        process.exit(1);
    }
} else {
    console.log('✅ Certificates already exist in /certs folder.');
}
