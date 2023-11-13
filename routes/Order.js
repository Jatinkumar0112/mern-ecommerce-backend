const express = require('express');
const { fetchOrderByUser, deleteOrder,createOrder, updateOrder,fetchAllOrders } = require('../controller/Order');

const router = express.Router();

router.post('/', createOrder)
      .get('/own/', fetchOrderByUser)
      .delete('/:id',deleteOrder)
      .patch('/:id',updateOrder)
      .get('/',fetchAllOrders)


exports.router = router;