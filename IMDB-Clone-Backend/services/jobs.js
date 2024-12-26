import jobs from "../daos/jobs.js";

async function pagination(filter, skip, limit, search, sort) {
    try {
        let { query, pipeline } = jobs.paginationQuery(filter, search);
        let result = await jobs.basicPagination(
            query,
            {
                skip: skip,
                limit: limit,
            },
            sort,
            pipeline
        );
        return Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

export default {
    pagination
}