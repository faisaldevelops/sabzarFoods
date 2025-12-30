import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { getOrdersData, getUserOrders, updateOrderTracking, getOrderTracking, exportOrdersCSV, getAddressSheet, getBulkAddressSheets, createManualOrder, getOrdersForLabels, markLabelsAsPrinted, exportLabelsSummaryCSV } from "../controllers/orders.controller.js";


const router = express.Router();

router.get("/", protectRoute, adminRoute, getOrdersData);
router.post("/manual", protectRoute, adminRoute, createManualOrder);
router.get("/export/csv", protectRoute, adminRoute, exportOrdersCSV);
router.get("/labels", protectRoute, adminRoute, getOrdersForLabels);
router.get("/labels/summary-csv", protectRoute, adminRoute, exportLabelsSummaryCSV);
router.post("/labels/mark-printed", protectRoute, adminRoute, markLabelsAsPrinted);
router.get("/bulk-address-sheets", protectRoute, adminRoute, getBulkAddressSheets);
router.get("/my-orders", protectRoute, getUserOrders);
router.get("/:orderId/tracking", protectRoute, getOrderTracking);
router.get("/:orderId/address-sheet", protectRoute, adminRoute, getAddressSheet);
router.patch("/:orderId/tracking", protectRoute, adminRoute, updateOrderTracking);

export default router;