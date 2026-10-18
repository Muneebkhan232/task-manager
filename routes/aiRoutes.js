const router = require('express').Router();
const { planTask } = require('../controllers/aiController');

router.post('/plan-task', planTask);

module.exports = router;
