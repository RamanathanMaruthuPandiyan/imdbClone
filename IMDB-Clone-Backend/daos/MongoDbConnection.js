import mongodb from 'mongodb';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const ObjectId = mongodb.ObjectId;
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
const mongoDBConfig = config.dbConfig;
const replica = mongoDBConfig.replica || "";
const options = {};

if (replica) {
    options.replicaSet = replica;
}

const mongoClient = new mongodb.MongoClient(mongoDBConfig.url, options);
let client;
//Cache the mongodb connection
const dbCache = {};

const MongoDBConnect = async function () {
    try {
        client = await mongoClient.connect();
        dbCache.db = client.db(mongoDBConfig.db);
        console.log(`Connection with mongodb successful ${new Date()}`);
        return Promise.resolve();
    }
    catch (e) {
        console.log(`Error while connecting to Mongo DB ${e}`);
        return Promise.reject(e);
    }
};
await MongoDBConnect();

const getDatabase = function () {
    return dbCache.db;
};

export { getDatabase as getDatabase };
export { client as client };
export { ObjectId as ObjectId };