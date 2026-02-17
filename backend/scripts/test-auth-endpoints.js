// Native fetch is available in Node 18+

// If running in an environment without native fetch, this might fail, but user is on Node 20.
// We will try-catch the entire process.

const BASE_URL = 'http://localhost:3000/api/auth';
const TEST_USER = {
    name: 'Test Setup User',
    email: `test_${Date.now()}@example.com`, // Unique email each time
    password: 'password123',
    role: 'employee'
};

async function runTests() {
    console.log('🧪 Starting Auth API Tests...\n');

    let token = '';

    // 1. Test Register
    console.log('1️⃣  Testing Registration...');
    try {
        const regRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        const regData = await regRes.json();

        if (regRes.status === 201) {
            console.log('✅ Registration Successful');
            console.log(`   User ID: ${regData.user.id}`);
        } else {
            console.error('❌ Registration Failed');
            console.error(regData);
        }
    } catch (error) {
        console.error('❌ Registration Network Error:', error.message);
    }

    // 2. Test Login
    console.log('\n2️⃣  Testing Login...');
    try {
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
        });
        const loginData = await loginRes.json();

        if (loginRes.status === 200) {
            console.log('✅ Login Successful');
            token = loginData.token;
            console.log('   Token received');
        } else {
            console.error('❌ Login Failed');
            console.error(loginData);
        }
    } catch (error) {
        console.error('❌ Login Network Error:', error.message);
    }

    // 3. Test Protected Route (Get Me)
    console.log('\n3️⃣  Testing Protected Route (/me)...');
    if (token) {
        try {
            const meRes = await fetch(`${BASE_URL}/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const meData = await meRes.json();

            if (meRes.status === 200) {
                console.log('✅ Protected Route Access Successful');
                console.log(`   Authenticated as: ${meData.user.email}`);
            } else {
                console.error('❌ Protected Route Access Failed');
                console.error(meData);
            }
        } catch (error) {
            console.error('❌ Protected Route Network Error:', error.message);
        }
    } else {
        console.log('⚠️  Skipping Protected Route test (No token available)');
    }

    // 4. Test Invalid Login
    console.log('\n4️⃣  Testing Invalid Login (Expected Failure)...');
    try {
        const failRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER.email, password: 'wrongpassword' })
        });

        if (failRes.status === 401) {
            console.log('✅ Invalid Login Rejected correctly (401)');
        } else {
            console.error(`❌ Unexpected status for invalid login: ${failRes.status}`);
        }
    } catch (error) {
        console.error('❌ Invalid Login Network Error:', error.message);
    }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
    console.log('⚠️  Native fetch not found. Installing node-fetch isn\'t necessary if you use Node 18+. Running fallback...');
    // In a real scenario we'd polyfill, but assuming Node 20 here.
}

runTests();
