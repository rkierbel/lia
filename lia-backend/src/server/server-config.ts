import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

export const configureServer = () => {
    const app = express();
    const PORT = process.env.PORT || 3003;

    app.use(express.json());
    app.use(morgan('dev'));
    app.use(cors());

    return { app, PORT };
};

export const setResponseHeaders = (res: express.Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader("Access-Control-Allow-Origin", "*");
};