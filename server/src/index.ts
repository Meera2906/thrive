import express from "express";
import cors from "cors";
import patientRoutes from "./routes/patientRoutes";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", patientRoutes);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Thrive risk API listening on http://localhost:${PORT}`);
});
