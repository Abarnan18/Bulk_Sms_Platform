import nodemailer from 'nodemailer';
import 'dotenv/config';

console.log('--- Email Connectivity Test ---');
console.log('Host:', 'smtp-relay.brevo.com');
console.log('User:', process.env.SMTP_USER);
console.log('Sender:', process.env.SENDER_EMAIL);

const testConfigs = [
    { port: 587, secure: false, name: 'Standard (587)' },
    { port: 465, secure: true, name: 'SSL (465)' },
    { port: 2525, secure: false, name: 'Alternate (2525)' }
];

async function runTest(config) {
    console.log(`\nTesting ${config.name}...`);
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: config.port,
        secure: config.secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        connectionTimeout: 10000,
        debug: true,
        logger: true
    });

    try {
        await transporter.verify();
        console.log(`✅ ${config.name} connection successful!`);
        return true;
    } catch (error) {
        console.error(`❌ ${config.name} failed: ${error.message}`);
        return false;
    }
}

(async () => {
    for (const config of testConfigs) {
        const success = await runTest(config);
        if (success) {
            console.log(`\nRecommended configuration found: ${config.name}`);
            break;
        }
    }
    console.log('\n--- Test Finished ---');
})();
