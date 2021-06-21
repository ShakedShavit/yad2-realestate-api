const express = require('express');
const cors = require('cors');
require('./db/mongoose');
const userRouter = require('./routers/user');
const apartmentRouter = require('./routers/apartment');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(userRouter);
app.use(apartmentRouter);

app.listen(port, () => {
    console.log('Server connected on port:', port);
});