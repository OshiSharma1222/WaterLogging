const express = require('express');
const router = express.Router();
const wardController = require('../controllers/wardController');

// GET /api/wards - Get all wards (with optional filters)
router.get('/', wardController.getAllWards);

// GET /api/wards/statistics - Get ward statistics
router.get('/statistics', wardController.getWardStatistics);

// GET /api/wards/high-risk - Get high-risk wards
router.get('/high-risk', wardController.getHighRiskWards);

// GET /api/wards/zone/:zone - Get wards by zone
router.get('/zone/:zone', wardController.getWardsByZone);

// GET /api/wards/:id - Get specific ward
router.get('/:id', wardController.getWardById);

// POST /api/wards - Create new ward (dynamic)
router.post('/', wardController.createWard);

// PUT /api/wards/:id - Update ward (admin)
router.put('/:id', wardController.updateWardStatus);

// DELETE /api/wards/:id - Delete ward
router.delete('/:id', wardController.deleteWard);

module.exports = router;
