const express = require('express');
const auth = require('../../middlewares/auth');
const upload = require('../../middlewares/upload');
const { uploadLimiter } = require('../../middlewares/rateLimiter');
const uploadController = require('../../controllers/upload.controller');

const router = express.Router();

router.post('/', auth(), uploadLimiter, upload.single('file'), uploadController.uploadFile);
router.get('/', auth(), uploadController.getFiles);
router.get('/stats', auth(), uploadController.getStats);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File upload and scanning management
 */

/**
 * @swagger
 * /uploads:
 *   post:
 *     summary: Upload a file for scanning
 *     description: Securely uploads a file (max 5MB) and queues it for the security engine.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 file:
 *                   $ref: '#/components/schemas/FileRecord'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 * 
 *   get:
 *     summary: Get user's file history
 *     description: Fetches all files uploaded by the authenticated user.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileRecord'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /uploads/stats:
 *   get:
 *     summary: Get global scan statistics
 *     description: Fetches aggregate stats for the admin dashboard.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
