import { Router } from "express";
import {
  createMission,
  updateMissionStatus,
  getMissions,
  abortMission,
} from "../controllers/mission.controller";

const router = Router();

router.post("/missions", createMission);

router.patch("/missions/:id/status", updateMissionStatus);

router.post("/missions/:id/abort", (req, res) => {
  abortMission(req, res).catch((error) => {
    console.error("Error in abort mission route:", error);
    res.status(500).json({ error: "Internal server error" });
  });
});

router.get("/missions", getMissions);

export default router;
