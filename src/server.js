const express = require("express");
require("dotenv").config();
const database = require("./config/db");
const authRouter = require("./routes/authRoute");
const errorHandler = require("./middleware/errorHandler")
const cors = require("cors");
const cookieParser = require("cookie-parser");




const app = express()
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use('/auth',authRouter);

app.use(errorHandler)


PORT = 3000

app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
});