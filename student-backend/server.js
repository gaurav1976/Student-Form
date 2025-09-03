import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();

// ✅ CORS: allow both frontends
app.use(cors({
  origin: [
    "https://student-form-vv1j.vercel.app",
    "https://www.admin-staff-vercel.com"
  ],
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  credentials: true
}));

// ✅ JSON parsing
app.use(express.json());

// ✅ Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// ✅ Serve uploads folder statically
app.use("/uploads", express.static(uploadsDir));

// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ✅ Student schema
const studentSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  rollno: { type: String, required: true },
  dob: { type: String, required: true },
  mobile: { type: String, required: true },
  bloodgroup: { type: String, required: true },
  address: { type: String, required: true },
  photo: { type: String, required: true },
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  }
});
const upload = multer({ storage });

// ✅ Routes
app.post("/students", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Photo is required" });

    const student = new Student({
      fullname: req.body.fullname,
      rollno: req.body.rollno,
      dob: req.body.dob,
      mobile: req.body.mobile,
      bloodgroup: req.body.bloodgroup,
      address: req.body.address,
      photo: "/uploads/" + req.file.filename,
    });

    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 }); // latest first
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/students/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // ✅ Delete photo from server
    const photoPath = path.join(process.cwd(), student.photo);
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);

    await student.remove();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));