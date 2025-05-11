import "dotenv/config";
import express from "express";
import cors from "cors";
// import { expenseRouter } from "./routes/expense.route";
import { errorHandler } from "./middlewares/error";
import { createServer } from "http";
import env from "./lib/env";
import droneRoutes from "./routes/drone.route";
import missionRoutes from "./routes/mission.route";
import { initializeWebSocket } from "./controllers/mission.controller";

const app = express();
const server = createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

const corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(errorHandler);

app.use("/api/test", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});
app.use("/api/v1", droneRoutes);
app.use("/api/v1", missionRoutes);
// app.use("/api/expense", expenseRouter);

const port = env.PORT;
server.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
