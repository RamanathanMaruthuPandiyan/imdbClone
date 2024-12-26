import { BaseDao } from "./baseDao.js";
const dao = BaseDao("movies");

function constructObj(dataObj) {
    try {
        let obj = {
            name: dataObj.name,
            yearOfRelease: dataObj.yearOfRelease,
            plot: dataObj.plot,
            poster: dataObj.poster,
            ratings: dataObj.ratings,
            producers: dataObj.producers,
            actors: dataObj.actors
        }

        return obj;
    } catch (e) {
        throw e;
    }
}

function paginationQurey(filter = {}, search = "") {
    try {
        let query = {};
        let pipeline = [];
        if (filter.yearOfRelease && filter.yearOfRelease.length) {
            query["yearOfRelease"] = { $in: filter.yearOfRelease }
        }
        if (filter.ratings && filter.ratings.length) {
            query["ratings"] = { $in: filter.ratings }
        }

        if (search) {
            query.$or = [
                {
                    name: new RegExp(search, "i")
                },
                {
                    "producers.name": new RegExp(search, "i")
                },
                {
                    "actors.name": new RegExp(search, "i")
                },
                {
                    yearOfRelease: new RegExp(search, "i")
                }
            ]
        }

        pipeline = [
            {
                $project: {
                    "id": "$_id",
                    "name": 1,
                    "yearOfRelease": 1,
                    "plot": 1,
                    "poster": 1,
                    "ratings": 1,
                    "producerNames": { $map: { input: "$producers", as: "producer", in: "$$producer.name" } },
                    "actorNames": { $map: { input: "$actors", as: "actor", in: "$$actor.name" } },
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
    constructObj,
    paginationQurey
}