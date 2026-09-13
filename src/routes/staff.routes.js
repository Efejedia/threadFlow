const express = require('express');
const router = express.Router();
const staff = require('../controllers/staffController');
const { protect, requireOwner } = require('../middleware/auth');

router.use(protect, requireOwner);

/**
 * @openapi
 * /api/staff:
 *   post:
 *     tags: [Staff roster]
 *     summary: Add staff member (owner only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaff'
 *     responses:
 *       201:
 *         description: Staff created
 *       400:
 *         description: Duplicate name or bad PIN
 *   get:
 *     tags: [Staff roster]
 *     summary: List studio staff (owner only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff list
 */
router.post('/', staff.createStaff);
router.get('/', staff.listStaff);

/**
 * @openapi
 * /api/staff/{id}:
 *   patch:
 *     tags: [Staff roster]
 *     summary: Update staff (name, PIN, skills, active)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStaff'
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.patch('/:id', staff.updateStaff);

module.exports = router;