const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  list,
  get,
  create,
  update,
  remove,
} = require('../controllers/bookController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;

