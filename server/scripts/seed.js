const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const API_URL = 'http://localhost:3000/v1';

async function generateFixtures() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir);
  }

  // 1. Spoofed File (Text file masquerading as JPG)
  const spoofedPath = path.join(fixturesDir, 'spoofed.jpg');
  fs.writeFileSync(spoofedPath, 'This is definitely not a real JPEG image, it is a text file!');

  // 2. Suspicious Archive (Zip containing an executable)
  const zip1 = new AdmZip();
  zip1.addFile('readme.txt', Buffer.from('Hello'));
  zip1.addFile('malware.exe', Buffer.from('MZ... this is a fake executable'));
  const suspiciousPath = path.join(fixturesDir, 'suspicious.zip');
  zip1.writeZip(suspiciousPath);

  // 3. Zip Bomb (Archive with > 10000 files)
  const zip2 = new AdmZip();
  for (let i = 0; i < 10005; i++) {
    zip2.addFile(`dummy/file${i}.txt`, Buffer.from('A'));
  }
  const zipBombPath = path.join(fixturesDir, 'zipbomb.zip');
  zip2.writeZip(zipBombPath);

  // 4. Safe File
  const safePath = path.join(fixturesDir, 'safe_document.txt');
  fs.writeFileSync(safePath, 'This is a normal, safe text document for demonstration purposes.');

  // 5. Oversized File (6MB to trigger Multer limit)
  const oversizedPath = path.join(fixturesDir, 'oversized.txt');
  const buffer = Buffer.alloc(6 * 1024 * 1024, 'B'); // 6MB of 'B's
  fs.writeFileSync(oversizedPath, buffer);

  return {
    spoofedPath,
    suspiciousPath,
    zipBombPath,
    safePath,
    oversizedPath
  };
}

async function uploadFile(filePath, token) {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  try {
    const res = await axios.post(`${API_URL}/uploads`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`[SUCCESS] Uploaded ${path.basename(filePath)} -> Status: ${res.data.file.status}`);
  } catch (error) {
    if (error.response) {
      console.log(`[ERROR] Uploading ${path.basename(filePath)} failed: ${error.response.data.message}`);
    } else {
      console.log(`[ERROR] Uploading ${path.basename(filePath)} failed: ${error.message}`);
    }
  }
}

async function run() {
  console.log('--- Starting SecureShield Seed Script ---');
  
  // Register a demo admin user
  let token;
  const email = `demo_admin_${Date.now()}@example.com`;
  try {
    console.log(`Registering demo admin user: ${email}`);
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Demo Admin',
      email: email,
      password: 'password1'
    });
    token = regRes.data.tokens.access.token;
  } catch (err) {
    console.error('Registration failed (is the server running on port 3000?)', err.message);
    process.exit(1);
  }

  // Elevate to admin (Direct DB update for demo purposes)
  try {
    const mongoose = require('mongoose');
    const User = require('../src/models/user.model');
    // Using environment variable or default fallback
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/node-boilerplate';
    
    // Check if mongoose is already connected to avoid duplicate connection error
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      });
    }
    await User.updateOne({ email: email }, { role: 'admin' });
    console.log('Elevated user to admin role in database.');
    // Keep connection open or close it? We can leave it since script exits soon, but better to close.
    await mongoose.connection.close();
  } catch (dbErr) {
    console.log('Could not elevate to admin via DB, continuing as regular user...', dbErr.message);
  }

  console.log('Generating test fixtures...');
  const fixtures = await generateFixtures();

  console.log('Uploading test fixtures...');
  await uploadFile(fixtures.safePath, token);
  await uploadFile(fixtures.spoofedPath, token);
  await uploadFile(fixtures.suspiciousPath, token);
  await uploadFile(fixtures.zipBombPath, token);
  await uploadFile(fixtures.oversizedPath, token);

  console.log('Waiting 5 seconds for background scanner to process files...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const statsRes = await axios.get(`${API_URL}/uploads/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n--- Final Admin Stats ---');
    console.log(JSON.stringify(statsRes.data, null, 2));
  } catch (err) {
    console.log('Could not fetch admin stats (User might not have been elevated to admin).', err.message);
  }

  console.log('\nSeed complete! Check the Dashboard UI to see the results.');
}

run();
