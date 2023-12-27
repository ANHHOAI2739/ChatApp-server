import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import dbConnection from './configs/dbConfig.js';
import router from './routes/index.js';
import { errorHandlerMiddleware } from './middlewares/errorMiddleware.js';

const app = express();
const PORT = 4000;

const whitelist = ['http://localhost:5173'];

const corsOptions = {
  origin: ['http://localhost:5173'],
  credentials: true,
};

dbConnection();

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use('/api/', router);

app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
