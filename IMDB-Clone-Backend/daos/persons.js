import { BaseDao } from "./baseDao.js";
import moment from 'moment';
const dao = BaseDao("persons");

const map = {
    Actor: "isActor",
    Producer: "isProducer"
}

function paginationQurey(filter = {}, search = "") {
    try {
        let query = {};
        let pipeline = [];
        if (filter.dob) {
            filter.dob = new Date(filter.dob);
            query['dob'] = {
                $gte: filter.dob,
                $lt: new Date(moment(filter.dob, "YYYY-MM-DD").add(1, 'days').startOf("day"))
            };
        }
        if (filter.gender && filter.gender.length) {
            query["gender"] = { $in: filter.gender }
        }

        if (filter.roles && filter.roles.length) {
            filter.roles.map((role) => {
                query[`roles.${map[role]}`] = true;
            });
        }

        if (search) {
            query["name"] = new RegExp(search, "i");
        }

        pipeline = [
            {
                $project: {
                    "id": "$_id",
                    "name": 1,
                    "gender": 1,
                    "dob": {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$dob"
                        }
                    },
                    "bio": 1,
                    "roles": 1,
                    "_id": 0
                }
            }
        ]

        return { pipeline, query }
    } catch (e) {
        throw e;
    }
}


export default {
    ...dao,
    paginationQurey
}