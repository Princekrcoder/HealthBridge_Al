const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const certsDir = path.join(__dirname, 'certs');

if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
}

const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('Certificates not found. Generating self-signed certificates...');
    
    try {
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = selfsigned.generate(attrs, {
            days: 365,
            keySize: 2048,
            extensions: [{
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: 'localhost' },
                    { type: 7, ip: '127.0.0.1' },
                    { type: 7, ip: '172.20.49.40' },
                ]
            }]
        });

        console.log("Keys available:", Object.keys(pems));
        fs.writeFileSync(keyPath, pems.private || pems.clientprivate || pems.privateKey);
        fs.writeFileSync(certPath, pems.cert || pems.clientcert || pems.certificate);
        console.log('✅ Certificates generated successfully in /certs folder.');
    } catch (error) {
        console.error('❌ Failed to generate certificates:', error);
        process.exit(1);
    }
} else {
    console.log('✅ Certificates already exist in /certs folder.');
}
