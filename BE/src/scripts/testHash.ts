import bcrypt from 'bcryptjs';

async function testHashDirectly() {
    console.log('Testing bcrypt directly...\n');

    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log('Password:', password);
    console.log('Salt:', salt);
    console.log('Hash:', hash);
    console.log('');

    const match = await bcrypt.compare(password, hash);
    console.log('Compare result:', match ? '✅ MATCH' : '❌ NO MATCH');
}

testHashDirectly();
