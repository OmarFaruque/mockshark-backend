import express from "express";
import multer from "multer";
import {
  banUser,
  deleteUser,
  getUser,
  getUsers,
  getUsersByUser,
  updateUser,
} from "../../controllers/auth/user.js";
import {
  usersBan,
  usersEdit,
  usersList,
  usersRemove,
  usersSingle,
  usersUserList,
} from "../../utils/modules.js";
import verify from "../../utils/verifyToken.js";
import { createBrokerUser, createDeposit, createWithdraw, deleteOrder, forgotPassword, getBrokerUserById, getbrokerUsers, getDeposits, getExecutedOrders, getWithdraws, loginBrokerUser, placeOrder, resetPassword, sendResetPasswordLink, updateBrokerUser, updateBrokerUserFunds, updateDepositStatus, updateWithdrawStatus } from "../../controllers/auth/auth.js";


const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/v1/auth/users",   getUsers);
router.get("/v1/auth/user/users",   getUsersByUser);
router.get("/v1/auth/users/:id",   getUser);
router.put("/v1/auth/users/:id",   updateUser);
router.put("/v1/users/:id/ban",  banUser);
router.delete("/v1/auth/users/:id",   deleteUser);


//For customer
router.get("/v1/customer/auth/users/:id",  getUser);
router.put("/v1/customer/auth/users/:id", upload.single("image"),  updateUser);





//next Trade
// router.post("/v1/brokerusers", createBrokerUser);
router.post("/v1/brokerusers", createBrokerUser);
router.get("/v1/brokerusers/:userId", getBrokerUserById);

router.post("/v1/loginbrokerusers", loginBrokerUser); // for user and broker login
router.get("/v1/brokerusers", getbrokerUsers ); // for user and broker login
router.put('/v1/brokerusers/:userId', updateBrokerUser);
router.post("/v1/tradeorder", placeOrder)
router.get("/v1/executed-orders", getExecutedOrders )
router.get("/v1/limit-orders", getExecutedOrders )
router.delete("/v1/delete-order/:id", deleteOrder );
router.post("/v1/deposite", upload.single('depositImage'), createDeposit );
router.get("/v1/deposites", getDeposits );
router.post("/v1/withdraw", createWithdraw );
router.get("/v1/withdraws", getWithdraws );

// Update ledgerBalanceClose and margin_used for a broker user
router.put('/v1/brokerusers/:userId/update-funds', updateBrokerUserFunds);

// routes/depositRoutes.js
router.put("/v1/update-deposites/:id/status", updateDepositStatus);

// routes/withdrawRoutes.js
router.put("/v1/update-withdraws/:id/status", updateWithdrawStatus);


router.post('/v1/forgot-password', sendResetPasswordLink);
router.put('/v1/reset-password', resetPassword);
export default router;
