const http = require('http');

// Configuration
const PORT = 5000;
const LOGIN_PATH = '/api/login';
const SUMMARY_PATH = '/api/dashboard/summary';
const EMAIL = 'citizen1@test.com';
const PASSWORD = 'password';

function makeRequest(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            console.log('Response was not JSON:', data.substring(0, 100));
                            resolve(data);
                        }
                    } else {
                        reject({ statusCode: res.statusCode, body: data });
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testSummary() {
    try {
        console.log('1. Logging in...');
        const loginRes = await makeRequest(LOGIN_PATH, 'POST', {
            email: EMAIL,
            password: PASSWORD,
        });

        const token = loginRes.token;
        if (!token) {
            throw new Error('Login failed: No token returned');
        }
        console.log('✅ Login successful. Token received.');

        // Debug: Test existing route
        console.log('\n2. Testing /api/dashboard/citizen (Existing Route)...');
        try {
            const citizenRes = await makeRequest('/api/dashboard/citizen', 'GET', null, token);
            console.log('✅ Citizen Route Working. Response length:', JSON.stringify(citizenRes).length);
        } catch (e) {
            console.log('❌ Citizen Route Failed:', e.statusCode);
            if (e.statusCode === 404) console.log('   (This suggests dashboard routes are NOT mounted or path is wrong)');
        }

        console.log('\n3. Fetching Summary...');
        try {
            const summaryRes = await makeRequest(SUMMARY_PATH, 'GET', null, token);
            console.log('✅ Summary Response:', JSON.stringify(summaryRes, null, 2));

            if (summaryRes.name && summaryRes.lastCheck !== undefined) {
                console.log('🎉 Test Passed!');
            } else {
                console.log('❌ Test Failed: Missing name or lastCheck in response');
            }
        } catch (e) {
            console.log('❌ Summary Route Failed:', e.statusCode);
            if (e.statusCode === 404) console.log('   (This suggests /summary API is missing in dashboard.js or server not updated)');
            if (e.body) console.log('   Body preview:', e.body.substring(0, 200));
        }

    } catch (error) {
        if (error.statusCode) {
            console.error(`❌ Request Failed with Status ${error.statusCode}`);
        } else {
            console.error('❌ Error:', error);
        }
    }
}

testSummary();
