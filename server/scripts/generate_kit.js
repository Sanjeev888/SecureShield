const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const kitDir = path.join(__dirname, 'Malware_Test_Kit');
if (!fs.existsSync(kitDir)) {
  fs.mkdirSync(kitDir);
}

// 1. Spoofed File (Text file masquerading as JPG)
const spoofedPath = path.join(kitDir, 'spoofed_virus.jpg');
fs.writeFileSync(spoofedPath, 'This is definitely not a real JPEG image, it is a text file posing as an image!');

// 2. Suspicious Archive (Zip containing an executable)
const zip1 = new AdmZip();
zip1.addFile('readme.txt', Buffer.from('Hello, open the other file for a surprise!'));
zip1.addFile('malware.exe', Buffer.from('MZ... this is a fake executable representing a virus'));
zip1.writeZip(path.join(kitDir, 'suspicious_archive.zip'));

// 3. Zip Bomb (Archive with 10005 files)
const zip2 = new AdmZip();
for (let i = 0; i < 10005; i++) {
  zip2.addFile(`dummy/file${i}.txt`, Buffer.from('A'));
}
zip2.writeZip(path.join(kitDir, 'zipbomb.zip'));

// 4. Oversized File (6MB to trigger Multer limit on frontend)
const buffer = Buffer.alloc(6 * 1024 * 1024, 'B'); // 6MB of 'B's
fs.writeFileSync(path.join(kitDir, 'oversized_6MB.txt'), buffer);

// 5. Safe Document
fs.writeFileSync(path.join(kitDir, 'safe_document.txt'), 'This is a normal, safe text document for demonstration purposes.');

console.log('Malware Test Kit successfully generated at: ' + kitDir);
