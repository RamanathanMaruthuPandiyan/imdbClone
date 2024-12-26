import { BaseDao } from "./baseDao.js";
import { Jobs } from "../enums/enums.js";
const dao = BaseDao("jobs");
import moment from 'moment';
import { extractSearchKeys } from "../services/common.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const config = require('../config/config.' + process.env.NODE_ENV);


function paginationQuery(filter = {}, search = "") {
    try {
        let query = {};

        if (filter.name && filter.name.length) {
            query.name = { $in: filter.name };
        }

        if (filter.status && filter.status.length) {
            query.status = { $in: filter.status };
        }

        if (filter.createDate) {
            filter.createDate = new Date(filter.createDate);
            query['dates.created'] = {
                $gte: filter.createDate,
                $lt: new Date(moment(filter.createDate, "YYYY-MM-DD").add(1, 'days').startOf("day"))
            };
        }

        if (search) {
            let searchKeys = extractSearchKeys(Jobs.names, search);
            query.$or = [
                {
                    name: { $in: searchKeys }
                },
                {
                    "reason": new RegExp(search, "i")
                },
                {
                    "message": new RegExp(search, "i")
                }
            ]
        }

        let pipeline = [
            {
                $project: {
                    _id: 1,
                    name: 1,
                    status: 1,
                    "dates.created": 1,
                    created: {
                        "$dateToString": {
                            "format": "%Y-%m-%d %H:%M:%S",
                            "date": "$dates.created",
                            "timezone": config.timeZoneConfig.timezone
                        }
                    },
                    started: {
                        "$dateToString": {
                            "format": "%Y-%m-%d %H:%M:%S",
                            "date": "$dates.started",
                            "timezone": config.timeZoneConfig.timezone
                        }
                    },
                    ended: {
                        "$dateToString": {
                            "format": "%Y-%m-%d %H:%M:%S",
                            "date": "$dates.ended",
                            "timezone": config.timeZoneConfig.timezone
                        }
                    },
                    completionPercentage: 1,
                    message: { $ifNull: ["$message", ""] },
                    reason: { $ifNull: ["$reason", ""] }
                }
            }
        ]

        return { query, pipeline };
    } catch (e) {
        throw e;
    }
}

async function initializeJob(name, imdbId) {
    try {
        let job = {
            "name": name,
            "imdbId": imdbId,
            "status": Jobs.status.NotStarted,
            "dates": {
                "created": new Date()
            },
            completionPercentage: 0
        };
        let { insertedId } = await dao.create(job);
        return Promise.resolve(insertedId);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    ...dao,
    initializeJob,
    paginationQuery
}