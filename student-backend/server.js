import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Static folder to serve photos
app.use("/uploads", express.static("uploads"));

// MongoDB connect
mongoose.connect("mongodb://127.0.0.1:27017/nica", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

// ✅ Multer config to keep original name
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, file.originalname), // keep real name
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
      photo: "/uploads/" + req.file.originalname, // store path
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));