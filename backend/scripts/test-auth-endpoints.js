// Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:3000/api/auth';

// Helper to generate random users
const generateUser = (role = 'employee') => ({
    name: `${role} User`,
    email: `${role}_${Date.now()}@example.com`,
    password: 'password123',
    role
});

async function runTests() {
    console.log('🧪 Starting COMPREHENSIVE Auth API Tests...\n');

    const adminUser = generateUser('admin');
    const employeeUser = generateUser('employee');
    let adminToken = '';
    let employeeToken = '';

    // 1. REGISTRATION TESTS
    console.log('📝 1. Testing Registration');

    // 1.1 Register Admin
    try {
        console.log('   ➡ Registering Admin...');
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminUser)
        });
        const data = await res.json();

        if (res.status === 201) {
            console.log('   ✅ Admin Registration Successful');
            adminToken = data.token;
        } else {
            console.error('   ❌ Admin Registration Failed:', data);
        }
    } catch (error) { console.error('   ❌ Network Error:', error.message); }

    // 1.2 Register Employee
    try {
        console.log('   ➡ Registering Employee...');
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeUser)
        });
        const data = await res.json();

        if (res.status === 201) {
            console.log('   ✅ Employee Registration Successful');
            employeeToken = data.token;
        } else {
            console.error('   ❌ Employee Registration Failed:', data);
        }
    } catch (error) { console.error('   ❌ Network Error:', error.message); }

    // 1.3 Duplicate Email Test
    try {
        console.log('   ➡ Testing Duplicate Email...');
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminUser) // Try to register admin again
        });

        if (res.status === 400) {
            console.log('   ✅ Duplicate Email Rejected correctly (400)');
        } else {
            console.error(`   ❌ Unexpected status for duplicate: ${res.status}`);
        }
    } catch (error) { console.error('   ❌ Network Error:', error.message); }

    // 1.4 Invalid Data Test
    try {
        console.log('   ➡ Testing Short Password...');
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...employeeUser, email: `bad_${Date.now()}@test.com`, password: '123' })
        });

        if (res.status === 400) {
            console.log('   ✅ Short Password Rejected correctly (400)');
        } else {
            console.error(`   ❌ Unexpected status for short password: ${res.status}`);
        }
    } catch (error) { console.error('   ❌ Network Error:', error.message); }


    // 2. LOGIN TESTS

    console.log('\n🔑 2. Testing Login');

    // 2.1 Valid Login
    try {
        console.log('   ➡ Valid Login...');
        const res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminUser.email, password: adminUser.password })
        });
        const data = await res.json();

        if (res.status === 200 && data.token) {
            console.log('   ✅ Login Successful');
            // Update token just in case
            adminToken = data.token;
        } else {
            console.error('   ❌ Login Failed:', data);
        }
    } catch (error) { console.error('   ❌ Network Error:', error.message); }

    // 2.2 Invalid Password
    try {
        console.log('   ➡ Invalid Password...');
        const res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminUser.email, password: 'wrongpassword' })
        });

        if (res.status === 401) {
            console.log('   ✅ Invalid Password Rejected correctly (401)');
        } else {
            console.error(`   ❌ Unexpected status: ${res.status}`);
        }
    } catch (error) { console.error('   ❌ Network Error:', error.message); }


    // 3. PROTECTED ROUTES & ROLES

    console.log('\n🛡️ 3. Testing Protected Routes & Roles');

    // 3.1 Get Me (Employee)
    try {
        console.log('   ➡ Get Me (Employee)...');
        const res = await fetch(`${BASE_URL}/me`, {
            headers: { 'Authorization': `Bearer ${employeeToken}` }
        });
        const data = await res.json();

        if (res.status === 200 && data.user.email === employeeUser.email) {
            console.log('   ✅ /me Access Successful');
        } else {
            console.error('   ❌ /me Access Failed:', data);
        }
    } catch (error) { console.error('   ❌ Network Error:', error.message); }

    // 3.2 Get Users (Admin Only) - AS ADMIN
    try {
        console.log('   ➡ Get All Users (As Admin)...');
        const res = await fetch(`${BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (res.status === 200) {
            const data = await res.json();
            console.log(`   ✅ Admin accessed /users successfully (Count: ${data.count})`);
        } else {
            console.error(`   ❌ Admin failed to access /users. Status: ${res.status}`);
        }
    } catch (error) { console.error('   ❌ Network Error:', error.message); }

    // 3.3 Get Users (Admin Only) - AS EMPLOYEE (SHOULD FAIL)
    try {
        console.log('   ➡ Get All Users (As Employee) - EXPECTING 403...');
        const res = await fetch(`${BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${employeeToken}` }
        });

        if (res.status === 403) {
            console.log('   ✅ Employee correctly blocked from /users (403)');
        } else {
            console.error(`   ❌ FAIL: Employee allowed or wrong error. Status: ${res.status}`);
        }
    } catch (error) { console.error('   ❌ Network Error:', error.message); }

    console.log('\n🏁 Tests Completed.');
}

runTests();
