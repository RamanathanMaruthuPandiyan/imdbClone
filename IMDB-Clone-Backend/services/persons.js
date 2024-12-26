import persons from "../daos/persons.js";
import movies from "../daos/movies.js";
import { Sex, Action_Items } from "../enums/enums.js";
import { client } from "../daos/MongoDbConnection.js";

const booleanSet = new Set([true, false]);

function validatePayload(data) {
    try {
        let name = data.name;
        let gender = data.gender;
        let dob = data.dob;
        let bio = data.bio;
        let isActor = data.isActor;
        let isProducer = data.isProducer;

        if (!(name && gender && dob && bio && booleanSet.has(isActor) && booleanSet.has(isProducer))) {
            throw new Error("The mandatory fields are missing.");
        }

        return {
            name,
            gender,
            dob: new Date(dob),
            bio,
            roles: {
                isActor: isActor,
                isProducer: isProducer
            }
        }
    } catch (e) {
        throw e;
    }
}

async function getActionItems(id) {
    try {
        let isRecordExist = Boolean(await persons.count({ _id: id }));
        if (!isRecordExist) {
            throw new Error("Received invalid id.");
        }
        let actionItems = [Action_Items.action.EDIT];
        let mappingExist = await movies.count({
            $or: [
                { "producers.id": id },
                { "actors.id": id }
            ]
        });
        if (!mappingExist) {
            actionItems = [...actionItems, Action_Items.action.DELETE];
        }
        return Promise.resolve(actionItems);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getFilterOptions() {
    try {
        let gender = await persons.distinct("gender");
        let obj = {
            gender: {
                displayName: "Gender",
                options: gender,
                isGender: true
            },
            roles: {
                displayName: "Roles",
                options: ["Actor", "Producer"]
            },
        }

        return obj;
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getPerson(id) {
    try {
        let result = await persons.get(id, {
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
        });

        if (!result || !Object.keys(result).length) {
            throw new Error("Received invalid id.");
        }

        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function pagination(filter, skip, limit, search, sort) {
    try {
        let { pipeline, query } = persons.paginationQurey(filter, search);
        let result = persons.basicPagination(
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

async function validateForUniqueness(name, dob, id) {
    try {
        let query = { name: name, dob: dob };
        if (id) {
            query._id = { $ne: id };
        }
        const existingPerson = await persons.getOne(query);
        if (existingPerson && Object.keys(existingPerson).length) {
            return true;
        }
        return false;
    } catch (e) {
        throw e;
    }
}

async function validatePerson(dataObj, id) {
    try {
        if (id) {
            let isRecordExist = Boolean(await persons.count({ _id: id }));
            if (!isRecordExist) {
                throw new Error("Received invalid id.");
            }
        }

        if (await validateForUniqueness(dataObj.name, dataObj.dob, id)) {
            throw new Error("The name and date of birth can't be duplicated.");
        }

        if (!Sex.gender.isValidValue(dataObj.gender)) {
            throw new Error("Invalid gender.");
        }
    } catch (e) {
        return Promise.reject(e);
    }
}

async function addPerson(dataObj) {
    try {
        await validatePerson(dataObj);
        let result = await persons.create(dataObj);
        if (!result || !result.insertedId) {
            throw new Error("Error while adding the person.");
        }
        return Promise.resolve(`The Person: ${dataObj.name} was added successfully.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function updatePerson(id, dataObj) {
    try {
        await validatePerson(dataObj, id);

        const session = client.startSession();

        try {
            const transactionOptions = {
                readPreference: "primary",
                readConcern: { level: "local" },
                writeConcern: { w: "majority" },
                maxCommitTimeMS: 1000,
            };

            await session.withTransaction(async () => {
                let result = await persons.update(id, "SET", dataObj, { session });

                let query = {
                    $or: [
                        { producers: { $elemMatch: { id: id } } },
                        { actors: { $elemMatch: { id: id } } }
                    ]
                }

                let updateDetail = {
                    "producers.$[elem].name": dataObj.name,
                    "actors.$[elem].name": dataObj.name,
                    "producers.$[elem].dob": dataObj.dob,
                    "actors.$[elem].dob": dataObj.dob,
                };
                let moviRes = await movies.updateMany(query, "SET", updateDetail, { session, arrayFilters: [{ "elem.id": id }] });

                if (!result || !result.modifiedCount) {
                    throw new Error("No modifications found.");
                }
            }, transactionOptions);
        } catch (e) {
            return Promise.reject(e);
        } finally {
            await session.endSession();
        }

        return Promise.resolve(`The Person: ${dataObj.name} was updated successfully.`);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function deletePerson(id) {
    try {
        let personRecord = await persons.get(id);
        if (!personRecord || !Object.keys(personRecord).length) {
            throw new Error("Received invalid id.");
        }

        const query = {
            $or: [
                { producer: { $elemMatch: { id: id } } },
                { actor: { $elemMatch: { id: id } } }
            ]
        };
        let mappingExist = Boolean(await movies.count(query));
        if (mappingExist) {
            throw new Error("Sorry! you can't delete the person, since it is been mapped under some movies.");
        }

        let result = await persons.remove(id);
        if (!result || !result.deletedCount) {
            throw new Error("Error in deleting the person.");
        }

        return Promise.resolve(`The Person: ${personRecord.name} was deleted successfully.`);
    } catch (e) {
        return Promise.reject(e);
    }
}


export default {
    pagination,
    validatePayload,
    addPerson,
    updatePerson,
    deletePerson,
    getActionItems,
    getPerson,
    getFilterOptions
}