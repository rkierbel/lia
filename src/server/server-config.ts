import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

export const corsOptions = {
    origin: [
        'http://localhost:4200',
        process.env.LIA_UI as string,
        process.env.LIA_BACKEND as string
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Accept-Encoding',
        'Accept-Language',
        'Connection',
        'Content-Length',
        'Host',
        'Priority',
        'Referer',
        'Sec-Fetch-Dest',
        'Sec-Fetch-Mode',
        'Sec-Fetch-Site',
        'User-Agent'
    ],
    credentials: false,
    exposedHeaders: ['Content-Type', 'Transfer-Encoding']
};

export const configureServer = () => {
    const app = express();
    const PORT = process.env.HOST_PORT || 3003;

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(morgan('dev'));

    return { app, PORT };
};

export const setResponseHeaders = (res: express.Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
};