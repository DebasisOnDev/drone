import { Router, RequestHandler } from "express";
import {
  getDronesWithAvailability,
  getDroneById,
  getDronesByRange,
  createDrone,
} from "../controllers/drone.controller";

const router = Router();

router.get("/drones/range", getDronesByRange as RequestHandler);
router.get("/drones/:id", getDroneById as RequestHandler);
router.get("/drones", getDronesWithAvailability as RequestHandler);
router.post("/drones", createDrone as RequestHandler);

export default router;
