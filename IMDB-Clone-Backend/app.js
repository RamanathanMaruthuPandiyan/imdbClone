import express, { json, urlencoded, static as expressStatic } from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import httpRequestLogger from './logging/httpRequestLogger.js';
import { fileURLToPath } from 'url';
import cors from "cors";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const config = require(`./config/config.${process.env.NODE_ENV}.json`);

var app = express();

import persons from './routes/persons.js';
import movies from './routes/movies.js';
import enums from './routes/enums.js';
import s3 from './routes/s3.js';
import jobs from './routes/jobs.js';
import auth from "./routes/auth.js";

const corsOptions = {
    origin: config.corsWhiteList["IMDB-Clone-Frontend"].urls
};

app.use(cors(corsOptions));
app.use(httpRequestLogger);
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressStatic(join(__dirname, 'public')));

app.use("/persons", persons);
app.use("/movies", movies);
app.use("/enums", enums);
app.use("/s3", s3);
app.use("/jobs", jobs);
app.use("/auth", auth);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // Set locals, only providing error in development
    const response = {
        message: err.message,
        error: req.app.get('env') === 'development' ? err : {}, // Only show stacktrace in development
    };

    // Send the error response
    res.status(err.status || 500).json(response);
});

export default app;
