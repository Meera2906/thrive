import express from "express";
import cors from "cors";
import patientRoutes from "./routes/patientRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import callRoutes from "./routes/callRoutes";
import emailRoutes from "./routes/emailRoutes";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", patientRoutes);
app.use("/api", uploadRoutes);
app.use("/api", callRoutes);
app.use("/api", emailRoutes);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Thrive risk API listening on http://localhost:${PORT}`);
});
