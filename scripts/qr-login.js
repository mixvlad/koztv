#!/usr/bin/env node
/**
 * QR code login for Telegram (gramjs)
 * Run this first to create session, then use export-and-translate.js
 */

const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION_FILE = path.join(__dirname, '..', '.telegram-session');

if (!API_ID || !API_HASH) {
  console.error('Error: TELEGRAM_API_ID and TELEGRAM_API_HASH required in .env');
  process.exit(1);
}

// Load existing session if any
let savedSession = '';
if (fs.existsSync(SESSION_FILE)) {
  savedSession = fs.readFileSync(SESSION_FILE, 'utf-8').trim();
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('Telegram QR Login (gramjs)');
  console.log('==========================\n');

  const stringSession = new StringSession(savedSession);
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  await client.connect();

  // Check if already authorized
  if (await client.isUserAuthorized()) {
    const me = await client.getMe();
    console.log(`Already logged in as: ${me.firstName} (@${me.username})`);

    // Save session anyway
    const session = client.session.save();
    fs.writeFileSync(SESSION_FILE, session);
    console.log(`Session saved to: ${SESSION_FILE}`);

    await client.disconnect();
    return;
  }

  console.log('Generating QR code for login...');
  console.log('Scan with Telegram: Settings -> Devices -> Link Desktop Device\n');

  try {
    // Export login token for QR
    const result = await client.invoke(
      new Api.auth.ExportLoginToken({
        apiId: API_ID,
        apiHash: API_HASH,
        exceptIds: [],
      })
    );

    if (result instanceof Api.auth.LoginToken) {
      // Convert token to URL
      const tokenBase64 = Buffer.from(result.token).toString('base64url');
      const qrUrl = `tg://login?token=${tokenBase64}`;

      // Generate QR code as PNG file
      const qrFile = path.join(__dirname, '..', 'qr-login.png');
      try {
        const QRCode = require('qrcode');
        await QRCode.toFile(qrFile, qrUrl, { width: 300 });
        console.log(`QR code saved to: ${qrFile}`);
        console.log(`\nOpen the file and scan with Telegram!\n`);

        // Also try terminal output
        const qrString = await QRCode.toString(qrUrl, { type: 'terminal', small: true });
        console.log(qrString);
      } catch (e) {
        console.log('Could not generate QR image:', e.message);
      }

      console.log(`\nURL: ${qrUrl}\n`);
      console.log(`Token expires in ${result.expires - Math.floor(Date.now() / 1000)} seconds`);
      console.log('\nWaiting for scan...');

      // Poll for login completion
      const startTime = Date.now();
      const timeout = 180000; // 3 minutes

      while (Date.now() - startTime < timeout) {
        await new Promise(r => setTimeout(r, 2000));

        try {
          const checkResult = await client.invoke(
            new Api.auth.ExportLoginToken({
              apiId: API_ID,
              apiHash: API_HASH,
              exceptIds: [],
            })
          );

          if (checkResult instanceof Api.auth.LoginTokenSuccess) {
            console.log('\nQR scanned! Completing login...');

            // Get user info
            const me = await client.getMe();
            console.log(`\nLogged in as: ${me.firstName} (@${me.username})`);

            // Save session
            const session = client.session.save();
            fs.writeFileSync(SESSION_FILE, session);
            console.log(`Session saved to: ${SESSION_FILE}`);
            console.log('\nNow you can run:');
            console.log('  node scripts/export-and-translate.js --channel @channelname');

            await client.disconnect();
            return;
          } else if (checkResult instanceof Api.auth.LoginTokenMigrateTo) {
            console.log(`\nMigrating to DC ${checkResult.dcId}...`);

            // Import the token on the new DC
            await client._switchDC(checkResult.dcId);
            const importResult = await client.invoke(
              new Api.auth.ImportLoginToken({
                token: checkResult.token,
              })
            );

            if (importResult instanceof Api.auth.LoginTokenSuccess) {
              console.log('\nLogin successful after DC migration!');
              const me = await client.getMe();
              console.log(`\nLogged in as: ${me.firstName} (@${me.username})`);

              const session = client.session.save();
              fs.writeFileSync(SESSION_FILE, session);
              console.log(`Session saved to: ${SESSION_FILE}`);

              await client.disconnect();
              return;
            }
          }
        } catch (e) {
          if (e.message && e.message.includes('SESSION_PASSWORD_NEEDED')) {
            console.log('\n2FA required.');
            const password = await prompt('Enter 2FA password: ');

            await client.invoke(
              new Api.auth.CheckPassword({
                password: await client.computeCheck(
                  await client.invoke(new Api.account.GetPassword()),
                  password
                ),
              })
            );

            const me = await client.getMe();
            console.log(`\nLogged in as: ${me.firstName} (@${me.username})`);

            const session = client.session.save();
            fs.writeFileSync(SESSION_FILE, session);
            console.log(`Session saved to: ${SESSION_FILE}`);

            await client.disconnect();
            return;
          }
          // Ignore other errors during polling
        }
      }

      console.log('\nTimeout - QR code expired. Run again.');
    } else if (result instanceof Api.auth.LoginTokenSuccess) {
      console.log('Already authenticated!');
      const me = await client.getMe();
      console.log(`Logged in as: ${me.firstName} (@${me.username})`);
    }
  } catch (error) {
    console.error('\nError:', error.message);

    // Fallback to phone login
    console.log('\nFalling back to phone number login...');
    const phone = await prompt('Phone number (international format): ');

    await client.start({
      phoneNumber: async () => phone,
      phoneCode: async () => await prompt('Enter code: '),
      password: async () => await prompt('2FA password: '),
      onError: (err) => console.error('Auth error:', err),
    });

    const me = await client.getMe();
    console.log(`\nLogged in as: ${me.firstName} (@${me.username})`);

    const session = client.session.save();
    fs.writeFileSync(SESSION_FILE, session);
    console.log(`Session saved to: ${SESSION_FILE}`);
  } finally {
    await client.disconnect();
  }
}

main().catch(console.error);
