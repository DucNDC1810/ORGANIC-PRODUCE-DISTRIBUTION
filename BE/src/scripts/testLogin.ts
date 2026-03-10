import axios from 'axios';

async function testLogin() {
    try {
        console.log('Testing login with shipper@test.com...');

        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'shipper@test.com',
            password: '123456'
        });

        console.log('✅ Login successful!');
        console.log('Status:', response.status);
        console.log('Token:', response.data.data.token);
        console.log('User:', JSON.stringify(response.data.data.user, null, 2));
    } catch (error: any) {
        console.log('❌ Login failed!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testLogin();
