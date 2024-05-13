const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const nodemailer = require('nodemailer');

const client = new SecretsManagerClient({ region: "us-east-2" });

// secrets value
const secretArn = process.env.AMAZON_ARN;
const personalEmail = process.env.PERSONAL_EMAIL;

const getSecret = async () => {
    try {
        const command = new GetSecretValueCommand({ SecretId: secretArn });
        const response = await client.send(command);
        if (response.SecretString) {
            const secret = JSON.parse(response.SecretString);
            return secret;
        } else {
            const buff = Buffer.from(response.SecretBinary, "base64");
            const secret = buff.toString("ascii");
            return secret;
        }
    } catch (err) {
        console.error("Error retrieving secret:", err);
        throw err; // Rethrow the error to handle it in your main application
    } finally {
        client.destroy();
    }
};

const sendEmail = async (name, email, message) => {
    const secret = await getSecret();

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: secret.GMAIL_USER,
            pass: secret.GMAIL_PASS
        }
    });

    let info = await transporter.sendMail({
        from: '"Aksel.Dev" <AKSEL_DEV_NO_REPLY@gmail.com>',
        to: personalEmail,
        subject: 'New Form Submitted!',
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    });

    console.log("Message sent: %s", info.messageId);
};

module.exports = { getSecret, sendEmail };
