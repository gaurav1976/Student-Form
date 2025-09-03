import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";

const app = express();

// CORS: allow both frontends
app.use(cors({
  origin: [
    "https://student-form-vv1j.vercel.app",
    "https://www.admin-staff-vercel.com"
  ]
}));

app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Serve uploads
app.use("/uploads", express.static(uploadsDir));

// MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// Student schema
const studentSchema = new mongoose.Schema({
  fullname: String,
  rollno: String,
  dob: String,
  mobile: String,
  bloodgroup: String,
  address: String,
  photo: String,
});
const Student = mongoose.model("Student", studentSchema);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});
const upload = multer({ storage });

// Routes
app.post("/students", upload.single("photo"), async (req, res) => {
  try {
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
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/students/:id", async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));