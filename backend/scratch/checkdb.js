require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Auth = require("./src/modules/auth/auth.model");
  const Medicine = require("./src/modules/pharmacy/models/medicine.model");
  const ph = await Auth.findOne({ email: "onepharmacist@gmail.com" });
  console.log("Pharmacist:", ph ? ph.email : "not found", ph ? ph.hospitalId : "");
  const doc = await Auth.findOne({ email: "doctor@gmail.com" });
  console.log("Doctor:", doc ? doc.email : "not found", doc ? doc.hospitalId : "");
  const items = await Medicine.find({});
  console.log("Total meds:", items.length);
  items.forEach(i => console.log("Found:", i.name, "Stock:", i.stockQuantity, "Hospital:", i.hospitalId));
  process.exit(0);
});
