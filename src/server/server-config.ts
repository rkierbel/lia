import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

export const configureServer = () => {
    const app = express();
    const PORT = process.env.PORT || 3003;
    const corsOptions = {
        origin: 'http://localhost:4200',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Accept-Encoding',
            'Accept-Language',
            'Authorization'
        ],
        credentials: false,
    };

    // Apply cors middleware
    app.use(express.json());
    app.use(morgan('dev'));
    app.use(cors(corsOptions));

    return { app, PORT };
};

export const setResponseHeaders = (res: express.Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
};