import express from "express";
import {
  createBundle,
  createBundleOrder,
  createOrder,
  createOrderFail,
  createOrderPaddle,
  createOrderSsl,
  createOrderSuccess,
  deleteBundle,
  deleteOrder,

  downloadWithCredit,

  getBundleOrdersByUser,

  getBundles,

  getOrder,
  getOrders,
  getOrdersByUser,
 
 
 
  getSingleBundleOrder,
 
 
 
  getUserDownloads,
 
  getUserLicenses,
 
  handlePaddleWebhook,
 
  updateBundle,
 
  updateOrder,
} from "../../controllers/order/order.js";
// import {
//   orderEdit,
//   orderList,
//   orderRemove,
//   orderSingle,
//   orderUserList,
// } from "../../utils/modules.js";
import verify from "../../utils/verifyToken.js";

const router = express.Router();

router.post("/v1/orders",  createOrder);
router.post("/v1/orders-init", createOrderSsl);
router.post("/v1/orders-success", createOrderSuccess);
router.post("/v1/orders-fail", createOrderFail);
// router.get("/v1/orders", orderList, verify, getOrders);
router.get("/v1/orders",  getOrders);
// router.get("/v1/orders/user/:id", orderUserList, verify, getOrdersByUser);
router.get("/v1/orders/user/:id",  getOrdersByUser);
// router.get("/v1/orders/:id", orderSingle, verify, getOrder);
router.get("/v1/orders/:id",  getOrder);
// router.put("/v1/orders/:id", orderEdit, verify, updateOrder);
router.put("/v1/orders/:id", verify, updateOrder);
// router.delete("/v1/orders/:id", orderRemove, verify, deleteOrder);
router.delete("/v1/orders/:id", verify, deleteOrder);

router.get("/v1/downloads", getUserDownloads  );
router.get("/v1/licenses" , getUserLicenses)

router.post("/v1/bundle", createBundle)
router.get('/v1/bundles', getBundles  )
router.delete('/v1/bundle/:id', deleteBundle); 

router.put('/v1/bundle-update/:id', updateBundle);

router.get("/v1/download-with-credit", downloadWithCredit);

router.post("/v1/bundles/order", createBundleOrder)
router.get("/v1/bundle-orders/:id", getBundleOrdersByUser);
router.get("/v1/bundle-invoice-orders/:id", getSingleBundleOrder);
router.post('/v1/orders-paddle', createOrderPaddle);

router.post('/v1/paddle/webhook', express.urlencoded({ extended: true }), handlePaddleWebhook);

export default router;
