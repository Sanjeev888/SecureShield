const request = require('supertest');
const httpStatus = require('http-status');
const path = require('path');
const fs = require('fs');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const FileRecord = require('../../src/models/file.model');

setupTestDB();

describe('Upload routes', () => {
  describe('POST /v1/uploads', () => {
    let dummyFilePath;

    beforeAll(() => {
      dummyFilePath = path.join(__dirname, 'dummy.txt');
      fs.writeFileSync(dummyFilePath, 'dummy content');
    });

    afterAll(() => {
      if (fs.existsSync(dummyFilePath)) {
        fs.unlinkSync(dummyFilePath);
      }
    });

    test('should return 201 and successfully upload file if data is ok', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .post('/v1/uploads')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', dummyFilePath)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('file');
      expect(res.body.file).toHaveProperty('status', 'PENDING');

      const dbFile = await FileRecord.findById(res.body.file.id);
      expect(dbFile).toBeDefined();
      expect(dbFile.originalName).toBe('dummy.txt');
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app).post('/v1/uploads').expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 error if no file is provided', async () => {
      await insertUsers([userOne]);

      await request(app)
        .post('/v1/uploads')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/uploads', () => {
    test('should return 200 and apply pagination to get files', async () => {
      await insertUsers([userOne]);

      // Insert a dummy file record
      await FileRecord.create({
        originalName: 'test.pdf',
        filename: 'test-123.pdf',
        path: 'uploads/test-123.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        status: 'SAFE',
        user: userOne._id
      });

      const res = await request(app)
        .get('/v1/uploads')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('files');
      expect(res.body.files).toHaveLength(1);
      expect(res.body.files[0].originalName).toBe('test.pdf');
    });
  });

  describe('GET /v1/uploads/stats', () => {
    test('should return 200 and return stats if user is admin', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .get('/v1/uploads/stats')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('totalFiles');
      expect(res.body).toHaveProperty('safeFiles');
      expect(res.body).toHaveProperty('rejectedFiles');
    });

    test('should return 403 if user is not admin', async () => {
      await insertUsers([userOne]);

      await request(app)
        .get('/v1/uploads/stats')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });
  });
});
