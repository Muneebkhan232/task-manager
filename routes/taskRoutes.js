const router = require('express').Router();
const c = require('../controllers/taskController');

router.route('/').post(c.createTask).get(c.getTasks);
router.route('/:id').get(c.getTask).put(c.updateTask).delete(c.deleteTask);

module.exports = router;
