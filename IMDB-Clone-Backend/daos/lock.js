import { BaseDao } from "./baseDao.js";
const dao = BaseDao("lock");

async function acquireLock(resourceId, lockHolder, userId) {
    try {
        const now = new Date();
        const result = await dao.create(
            {
                resourceId: resourceId,
                lockHolder: lockHolder,
                lockedAt: now,
                userId: userId
            }
        );

        if (!result || !result.insertedId) {
            throw new Error(`Failed to acquire lock for resource ${resourceId}`);
        }
    } catch (e) {
        throw e;
    }

}

async function releaseLock(resourceId, options = {}) {
    try {
        const result = await dao.removeBy({ resourceId: resourceId }, options);
        if (!result || !result.deletedCount) {
            throw new Error(`Failed to release lock for resource ${resourceId}`);
        }
    } catch (e) {
        throw e;
    }
}

async function checkForLock(resourceId) {
    try {
        const result = await dao.count({ resourceId: resourceId });
        if (!result || !Object.keys(result).length) {
            return false;
        }
        return true;
    } catch (e) {
        throw e;
    }
}

export default {
    ...dao,
    acquireLock,
    releaseLock,
    checkForLock
}