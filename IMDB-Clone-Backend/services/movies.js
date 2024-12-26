import movies from "../daos/movies.js";
import { client, ObjectId } from "../daos/MongoDbConnection.js";
import persons from "../daos/persons.js";
import { Action_Items, Jobs } from "../enums/enums.js";
import imdb from "./remote/imdb.js";
import jobs from "../daos/jobs.js";
import lock from "../daos/lock.js";

function convertIdObjectId(ids) {
    try {
        if (ids && ids.length) {
            return ids.map((id) => { return ObjectId(id) });
        }
        return [];
    } catch (e) {
        throw e;
    }
}

async function getActionItems(id) {
    try {
        let isRecordExist = Boolean(await movies.count({ _id: id }));
        if (!isRecordExist) {
            throw new Error("Received invalid id.");
        }
        let actionItems = [Action_Items.action.EDIT, Action_Items.action.DELETE];
        return Promise.resolve(actionItems);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getFilterOptions() {
    try {
        let yearOfRelease = await movies.distinct("yearOfRelease");
        let ratings = await movies.distinct("ratings");
        let obj = {
            yearOfRelease: {
                displayName: "Year of Release",
                options: yearOfRelease
            },
            ratings: {
                displayName: "Ratings",
                options: ratings
            }
        }
        return obj;
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getMovie(id) {
    try {
        let result = await movies.get(id, {
            "id": "$_id",
            "name": 1,
            "yearOfRelease": 1,
            "plot": 1,
            "poster": 1,
            "filePath": 1,
            "ratings": 1,
            "producers": {
                $map: {
                    input: "$producers",
                    as: "producer",
                    in: {
                        value: "$$producer.id",
                        label: {
                            $concat: [
                                "$$producer.name",
                                "-",
                                {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$$producer.dob"
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            "actors": {
                $map: {
                    input: "$actors",
                    as: "actor",
                    in: {
                        value: "$$actor.id",
                        label: {
                            $concat: [
                                "$$actor.name",
                                "-",
                                {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$$actor.dob"
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            "_id": 0
        });

        if (!result || !Object.keys(result).length) {
            throw new Error("Received invalid id.");
        }

        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getDropdown() {
    try {
        let result = await persons.aggregate([
            {
                $match: {
                    $or: [
                        { "roles.isActor": true },
                        { "roles.isProducer": true }
                    ]
                }
            },
            {
                $project: {
                    id: "$_id",
                    name: 1,
                    dob: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$dob"
                        }
                    },
                    isActor: "$roles.isActor",
                    isProducer: "$roles.isProducer",
                    _id: 0
                }
            },
            {
                $group: {
                    _id: null,
                    actors: {
                        $push: {
                            $cond: [
                                { $eq: ["$isActor", true] },
                                { value: "$id", label: { $concat: ["$name", " - ", "$dob"] } },
                                "$$REMOVE"
                            ]
                        }
                    },
                    producers: {
                        $push: {
                            $cond: [
                                { $eq: ["$isProducer", true] },
                                { value: "$id", label: { $concat: ["$name", " - ", "$dob"] } },
                                "$$REMOVE"
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    actors: { $filter: { input: "$actors", as: "actor", cond: { $ne: ["$$actor", null] } } },
                    producers: { $filter: { input: "$producers", as: "producer", cond: { $ne: ["$$producer", null] } } }
                }
            }
        ]);
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function pagination(filter, skip, limit, search, sort) {
    try {
        let { pipeline, query } = movies.paginationQurey(filter, search);
        let result = movies.basicPagination(
            query,
            {
                skip: skip,
                limit: limit
            },
            sort,
            pipeline
        )

        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

function validatePayload(data) {
    try {
        let name = data.name;
        let yearOfRelease = data.yearOfRelease;
        let plot = data.plot;
        let poster = data.poster;
        let ratings = data.ratings;
        let producerIds = data.producerIds;
        let actorIds = data.actorIds;

        if (!(name && Number.isFinite(yearOfRelease) && plot &&
            poster && Number.isFinite(ratings) &&
            producerIds && producerIds.length &&
            actorIds && actorIds.length)) {
            throw new Error("Mandatory fields are missing.");
        }

        return {
            name,
            yearOfRelease,
            plot,
            poster,
            ratings,
            producerIds: convertIdObjectId(producerIds),
            actorIds: convertIdObjectId(actorIds)
        }
    } catch (e) {
        throw e;
    }
}

async function validateForUniqueness(name, yearOfRelease, id) {
    try {
        let query = { name: name, yearOfRelease: yearOfRelease };
        if (id) {
            query._id = { $ne: id };
        }
        const existingPerson = await movies.getOne(query);
        if (existingPerson && Object.keys(existingPerson).length) {
            return true;
        }
        return false;
    } catch (e) {
        throw e;
    }
}

async function validateMovie(dataObj, id) {
    try {
        if (id) {
            let isRecordExist = Boolean(await movies.count({ _id: id }));
            if (!isRecordExist) {
                throw new Error("Received invalid id.");
            }
        }

        if (await validateForUniqueness(dataObj.name, dataObj.yearOfRelease, id)) {
            throw new Error("The name and year of release can't be duplicated.");
        }
        let result = await persons.aggregate([
            {
                $facet: {
                    producer: [
                        { $match: { _id: { $in: dataObj.producerIds }, "roles.isProducer": true } },
                        { $project: { id: "$_id", name: 1, dob: 1, _id: 0 } }
                    ],
                    actor: [
                        { $match: { _id: { $in: dataObj.actorIds }, "roles.isActor": true } },
                        { $project: { id: "$_id", name: 1, dob: 1, _id: 0 } }
                    ]
                }
            }
        ]);

        let producers = result[0].producer || [];
        let actors = result[0].actor || [];

        // Validation
        if (producers.length !== dataObj.producerIds.length) {
            throw new Error("One or more provided producers are invalid.");
        }

        if (actors.length !== dataObj.actorIds.length) {
            throw new Error("One or more provided actors are invalid.");
        }

        dataObj.producers = producers;
        dataObj.actors = actors;
    } catch (e) {
        throw e;
    }
}

async function addMovie(dataObj) {
    try {
        await validateMovie(dataObj);
        let obj = movies.constructObj(dataObj);
        let result = await movies.create(obj);
        if (!result || !result.insertedId) {
            throw new Error("Error while adding the movie.");
        }
        return Promise.resolve(`The movie: ${dataObj.name} was added successfully.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function updateMovie(id, dataObj) {
    try {
        await validateMovie(dataObj, id);
        let obj = movies.constructObj(dataObj);
        let result = await movies.update(id, "SET", obj);
        if (!result || !result.modifiedCount) {
            throw new Error("No modifications found.");
        }
        return Promise.resolve(`The movie: ${dataObj.name} was updated successfully.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function deleteMovie(id) {
    try {
        let movieRecord = await movies.get(id);
        if (!movieRecord || !Object.keys(movieRecord).length) {
            throw new Error("Received invalid id.");
        }
        const session = client.startSession();
        try {
            const transactionOptions = {
                readPreference: "primary",
                readConcern: { level: "local" },
                writeConcern: { w: "majority" },
                maxCommitTimeMS: 1000,
            };

            await session.withTransaction(async () => {
                if (movieRecord.imdbId) {
                    await lock.releaseLock(movieRecord.imdbId, { session });
                }
                let result = await movies.remove(id, { session });

                if (!result || !result.deletedCount) {
                    throw new Error("Error in deleting the movie.");
                }
            }, transactionOptions);

        } catch (e) {
            return Promise.reject(e);
        }

        return Promise.resolve(`The Movie: ${movieRecord.name} was deleted successfully.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

//Import from IMDB Functionality starts from here.

async function importFromImdb(res, imdbId, name, yearOfRelease, poster, actors) {
    try {
        var jobId = await jobs.initializeJob(Jobs.names.IMPORT_IMBD, imdbId);
        res.send("Process initiated to import the movie from IMDB, Please check the job status later.");

        let isLockExist = await lock.checkForLock(imdbId);
        if (isLockExist) {
            throw new Error(`The movie "${name}" has already been imported or is currently in the process of being imported.`);
        }

        await lock.acquireLock(imdbId, jobId, "ADMIN");

        let movieObj = {
            imdbId: imdbId,
            name: name,
            yearOfRelease: yearOfRelease,
            poster: poster,
            actors: actors.map((act) => { return { ...act, id: new ObjectId() } }),
            producers: []
        }
        await imdb.getMovieObj(movieObj, jobId);

        let personArray = [];

        await imdb.getPersonObj(personArray, movieObj.actors, jobId);

        // Create conditions for $or operator
        const conditions = personArray.map(person => ({
            name: person.name,
            dob: person.dob,
        }));

        // Query the collection
        const matchingDocs = await persons.getBy({ $or: conditions });

        movieObj.actors = movieObj.actors.map(actor => {
            const matchingDoc = matchingDocs.find(doc =>
                doc.name === actor.name && new Date(doc.dob).getTime() === new Date(actor.dob).getTime()
            );

            return matchingDoc ? { ...actor, "id": matchingDoc._id } : actor;
        });

        // Filter unmatched persons from personArray
        const filteredArray = personArray.filter(person =>
            !matchingDocs.some(doc =>
                doc.name === person.name && new Date(doc.dob).getTime() === new Date(person.dob).getTime()
            )
        );

        const session = client.startSession();

        try {
            const transactionOptions = {
                readPreference: "primary",
                readConcern: { level: "local" },
                writeConcern: { w: "majority" },
                maxCommitTimeMS: 1000,
            };

            await session.withTransaction(async () => {
                if (filteredArray && filteredArray.length) {
                    await persons.createMany(filteredArray, { session });
                }

                let result = await movies.create(movieObj, { session });

                if (!result || !result.insertedId) {
                    await jobs.update(jobId, "SET", {
                        status: Jobs.status.Errored,
                        completionPercentage: 0,
                        "dates.ended": new Date(),
                        reason: "Unable to save the data."
                    });
                }

            }, transactionOptions);

            await jobs.update(jobId, "SET", {
                status: Jobs.status.Completed,
                completionPercentage: 100,
                "dates.ended": new Date(),
                message: `The movie '${name}' was imported, and the process completed successfully.`
            });
        } catch (e) {
            await jobs.update(jobId, "SET", {
                status: Jobs.status.Errored,
                completionPercentage: 0,
                "dates.ended": new Date(),
                reason: e.message
            });
            await lock.releaseLock(imdbId);
        } finally {
            await session.endSession();
        }

    } catch (e) {
        await jobs.update(jobId, "SET", {
            status: Jobs.status.Errored,
            completionPercentage: 0,
            "dates.ended": new Date(),
            reason: e.message
        });
        await lock.releaseLock(imdbId);
    }
}



export default {
    validatePayload,
    addMovie,
    updateMovie,
    deleteMovie,
    pagination,
    getMovie,
    getDropdown,
    importFromImdb,
    getActionItems,
    getFilterOptions
}