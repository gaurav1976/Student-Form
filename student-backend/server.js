import 'dotenv/config'; 
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// serve uploads folder
app.use("/uploads", express.static(uploadsDir));

// MongoDB connect using MONGO_URI from .env
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// Schema
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

// Multer config - unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${safeName}`);
  },
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
  const students = await Student.find();
  res.json(students);
});

app.delete("/students/:id", async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Start server: use env PORT (Render provides one)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
