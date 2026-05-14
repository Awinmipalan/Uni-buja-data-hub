import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const initialFacultyData = [
  { id: 1, name: 'Faculty of Law', students: 450, avgCgpa: 3.45, passRate: 88, staffRatio: '24:1', compliance: 'Optimal', studentId: 'UA/23/LAW/001' },
  { id: 2, name: 'Pharmaceutical Sciences', students: 380, avgCgpa: 3.38, passRate: 85, staffRatio: '18:1', compliance: 'Optimal', studentId: 'UA/23/PHA/042' },
  { id: 3, name: 'Veterinary Medicine', students: 210, avgCgpa: 3.12, passRate: 79, staffRatio: '15:1', compliance: 'Optimal', studentId: 'UA/23/VET/011' },
  { id: 4, name: 'Faculty of Science', students: 850, avgCgpa: 2.54, passRate: 64, staffRatio: '28:1', compliance: 'Acceptable', studentId: 'UA/23/SCI/089' },
  { id: 5, name: 'Faculty of Agriculture', students: 620, avgCgpa: 2.10, passRate: 58, staffRatio: '22:1', compliance: 'Acceptable', studentId: 'UA/23/AGR/102' },
  { id: 6, name: 'Faculty of Engineering', students: 950, avgCgpa: 2.85, passRate: 72, staffRatio: '32:1', compliance: 'Warning', studentId: 'UA/23/ENG/055' },
  { id: 7, name: 'Arts & Humanities', students: 1200, avgCgpa: 2.95, passRate: 75, staffRatio: '38:1', compliance: 'Action Required', studentId: 'UA/23/ART/201' },
];

const admissionRatesData = [
  { name: 'Law', admitted: 150, applied: 1200 },
  { name: 'Pharm', admitted: 120, applied: 800 },
  { name: 'Vet Med', admitted: 80, applied: 300 },
  { name: 'Science', admitted: 400, applied: 1500 },
  { name: 'Agric', admitted: 350, applied: 600 },
  { name: 'Eng', admitted: 250, applied: 1800 },
  { name: 'Arts', admitted: 500, applied: 1100 },
];

const jambScoresData = [
  { name: 'Law', Admitted: 275, Rejected: 210 },
  { name: 'Pharm', Admitted: 268, Rejected: 205 },
  { name: 'Vet Med', Admitted: 245, Rejected: 195 },
  { name: 'Science', Admitted: 220, Rejected: 180 },
  { name: 'Agric', Admitted: 205, Rejected: 175 },
  { name: 'Eng', Admitted: 260, Rejected: 200 },
  { name: 'Arts', Admitted: 215, Rejected: 185 },
];

const stateOfOriginData = [
  { name: 'FCT', value: 450 },
  { name: 'Kogi', value: 300 },
  { name: 'Nasarawa', value: 250 },
  { name: 'Niger', value: 200 },
  { name: 'Kaduna', value: 150 },
  { name: 'Others', value: 500 },
];

const revenueByFacultyData = [
  { name: 'Law', collected: 15.2, outstanding: 2.1 },
  { name: 'Pharm', collected: 18.5, outstanding: 1.5 },
  { name: 'Vet', collected: 12.0, outstanding: 3.2 },
  { name: 'Science', collected: 25.4, outstanding: 5.8 },
  { name: 'Agric', collected: 14.8, outstanding: 4.1 },
  { name: 'Eng', collected: 32.1, outstanding: 6.5 },
  { name: 'Arts', collected: 20.5, outstanding: 8.2 },
];

const paymentStatusData = [
  { name: 'Paid in Full', value: 75 },
  { name: 'Partial Payment', value: 15 },
  { name: 'Defaulters', value: 10 },
];

const recentTransactions = [
  { id: 'TRX-8291', student: 'UA/20/LAW/045', amount: 150000, date: new Date().toLocaleDateString(), status: 'Success', type: 'Tuition' },
  { id: 'TRX-8292', student: 'UA/22/ENG/112', amount: 85000, date: new Date().toLocaleDateString(), status: 'Pending', type: 'Hostel' },
  { id: 'TRX-8293', student: 'UA/19/SCI/003', amount: 120000, date: 'Yesterday', status: 'Success', type: 'Tuition' },
  { id: 'TRX-8294', student: 'UA/23/ART/289', amount: 50000, date: 'Yesterday', status: 'Failed', type: 'Acceptance' },
  { id: 'TRX-8295', student: 'UA/21/AGR/067', amount: 150000, date: 'Oct 12, 2024', status: 'Success', type: 'Tuition' },
];

const revenueTrend = [
  { name: 'Jan', revenue: 120 },
  { name: 'Feb', revenue: 150 },
  { name: 'Mar', revenue: 180 },
  { name: 'Apr', revenue: 220 },
  { name: 'May', revenue: 280 },
  { name: 'Jun', revenue: 260 },
  { name: 'Jul', revenue: 310 },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/dashboard/faculty-insights", (req, res) => {
    res.json(initialFacultyData);
  });

  app.get("/api/dashboard/admission-rates", (req, res) => {
    res.json(admissionRatesData);
  });

  app.get("/api/dashboard/jamb-scores", (req, res) => {
    res.json(jambScoresData);
  });

  app.get("/api/dashboard/state-origin", (req, res) => {
    res.json(stateOfOriginData);
  });

  app.get("/api/dashboard/finance/revenue-by-faculty", (req, res) => {
    res.json(revenueByFacultyData);
  });

  app.get("/api/dashboard/finance/payment-status", (req, res) => {
    res.json(paymentStatusData);
  });

  app.get("/api/dashboard/finance/recent-transactions", (req, res) => {
    res.json(recentTransactions);
  });

  app.get("/api/dashboard/finance/revenue-trend", (req, res) => {
    res.json(revenueTrend);
  });

  // Assign task endpoint (mock action)
  app.post("/api/dashboard/faculty/:id/tasks", (req, res) => {
    const { id } = req.params;
    const { task } = req.body;
    res.json({ success: true, message: `Task assigned to faculty ${id}`, task });
  });

  app.post("/api/dashboard/communication/email-deans", (req, res) => {
    res.json({ success: true, message: "Emails dispatched to all Deans successfully." });
  });

  app.post("/api/dashboard/finance/send-reminders", (req, res) => {
    res.json({ success: true, message: "Fee payment reminders sent to 1,245 students." });
  });

  // Vite middleware for development or Static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
