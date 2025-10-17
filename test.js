require('dotenv').config();
const { createTransport } = require('nodemailer');
const { UsesendTransport } = require('./dist/main.js');

// Replace with your actual Usesend API key
const USESEND_API_KEY = process.env.USESEND_API_KEY || 'your_api_key_here';
const USESEND_URL = process.env.USESEND_URL; // Optional custom API URL

async function testEmail() {
    try {
        console.log('Creating transport...');
        const transportOptions = {
            apiKey: USESEND_API_KEY
        };

        if (USESEND_URL) {
            transportOptions.apiUrl = USESEND_URL;
            console.log(`Using custom API URL: ${USESEND_URL}`);
        }

        const mailer = createTransport(
            UsesendTransport.makeTransport(transportOptions)
        );

        console.log('Sending test email...');
        const result = await mailer.sendMail({
            from: 'sajn <hej@sajn.se>',
            to: 'andreas@enemyr.com',
            subject: 'Test Email from usesend-nodemailer',
            html: '<h1>Hello!</h1><p>This is a test email.</p>',
        });

        console.log('✓ Email sent successfully!');
        console.log('Result:', result);
    } catch (error) {
        console.error('✗ Error sending email:');
        console.error(error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
    }
}

// Test with display name format
async function testEmailWithDisplayName() {
    try {
        console.log('\nTesting email with display name format...');
        const transportOptions = {
            apiKey: USESEND_API_KEY
        };

        if (USESEND_URL) {
            transportOptions.apiUrl = USESEND_URL;
        }

        const mailer = createTransport(
            UsesendTransport.makeTransport(transportOptions)
        );

        const result = await mailer.sendMail({
            from: 'Test Sender <hej@sajn.se>',
            to: 'Recipient Name <andreas@enemyr.com>',
            subject: 'Test Email with Display Name',
            html: '<p>Testing display name format!</p>',
        });

        console.log('✓ Email with display name sent successfully!');
        console.log('Result:', result);
    } catch (error) {
        console.error('✗ Error sending email with display name:');
        console.error(error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
    }
}

console.log('=== Testing usesend-nodemailer ===\n');
testEmail().then(() => testEmailWithDisplayName());
