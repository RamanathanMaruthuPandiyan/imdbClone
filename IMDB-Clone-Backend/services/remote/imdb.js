import axios from 'axios'
import { createRequire } from 'module';
import { Jobs } from '../../enums/enums.js';
import jobs from '../../daos/jobs.js';
import lock from '../../daos/lock.js';
const require = createRequire(import.meta.url);
const config = require(`../../config/config.${process.env.NODE_ENV}.json`);
const remoteConfig = config.remoteUrls.Rapid;

async function getSearch(searchTerm, type, limit, language) {
    try {
        const options = {
            method: 'GET',
            url: remoteConfig.searchMovie,
            params: {
                searchTerm: searchTerm,
                type: type,
                limit: limit,
                language: language
            },
            headers: {
                'x-rapidapi-key': remoteConfig.accessKey,
                'x-rapidapi-host': remoteConfig.host
            }
        };
        const result = await axios.request(options);

        if (!result || !Object.keys(result.data).length) {
            throw new Error("Failed to fetch movies from imdb server.");
        }

        let lockIds = await lock.distinct("resourceId");

        let simplifiedResult = [];

        let edges = result?.data?.data?.mainSearch?.edges || [];

        edges.forEach((value) => {
            let node = value?.node;
            if (!node) return;

            let obj = {
                imdbId: node?.entity?.id || "N/A",
                name: node?.entity?.titleText?.text || "Unknown Title",
                yearOfRelease: node?.entity?.releaseYear?.year || "Unknown Year",
                poster: node?.entity?.primaryImage?.url || "No Image Available",
                actors: [],
                producers: [],
                isImportAllowed: lockIds.includes(node?.entity?.id) ? false : true
            };

            let credits = node?.entity?.principalCredits?.[0]?.credits || [];
            credits.forEach((cred) => {
                if (cred?.name?.id && cred?.name?.nameText?.text) {
                    let credObj = {
                        personId: cred.name.id,
                        name: cred.name.nameText.text,
                    };
                    obj.actors.push(credObj);
                }
            });

            simplifiedResult.push(obj);
        });

        return Promise.resolve(simplifiedResult);
    } catch (e) {
        return Promise.reject(e);
    }
}

async function getMovieObj(obj, jobId) {
    try {
        await jobs.update(jobId, "SET", {
            status: Jobs.status.InProgress,
            "dates.started": new Date(),
            completionPercentage: 10
        });

        const optionsForGetRatings = {
            method: 'GET',
            url: remoteConfig.getRatings,
            params: {
                tconst: obj.imdbId
            },
            headers: {
                'x-rapidapi-key': remoteConfig.accessKey,
                'x-rapidapi-host': remoteConfig.host
            }
        };
        const ratings = await axios.request(optionsForGetRatings);

        obj.ratings = ratings?.data?.data?.title?.ratingsSummary?.aggregateRating || null;

        await jobs.update(jobId, "SET", {
            completionPercentage: 25
        });

        const optionsForGetPlot = {
            method: 'GET',
            url: remoteConfig.getPlot,
            params: {
                tconst: obj.imdbId
            },
            headers: {
                'x-rapidapi-key': remoteConfig.accessKey,
                'x-rapidapi-host': remoteConfig.host
            }
        };

        const plots = await axios.request(optionsForGetPlot);

        if (plots && Object.keys(plots.data).length) {
            obj.plot = plots?.data?.data?.title?.plots?.edges?.[0]?.node?.plotText?.plainText ||
                plots?.data?.data?.title?.plot?.plotText?.plainText || null;
        } else {
            obj.plot = null;
        }

        await jobs.update(jobId, "SET", {
            completionPercentage: 35
        });

    } catch (e) {
        throw e;
    }
}


async function getPersonObj(personArray, actors, jobId) {
    try {
        await jobs.update(jobId, "SET", {
            completionPercentage: 40
        });

        const fetchActorOverview = async (act) => {
            const obj = {
                _id: act.id,
                name: act.name,
                gender: null,
                roles: {
                    isActor: true,
                    isProducer: false
                }
            };

            const optionsForGetOverview = {
                method: 'GET',
                url: remoteConfig.getOverview,
                params: {
                    nconst: act.personId
                },
                headers: {
                    'x-rapidapi-key': remoteConfig.accessKey,
                    'x-rapidapi-host': remoteConfig.host
                }
            };

            try {
                const overview = await axios.request(optionsForGetOverview);
                if (overview?.data?.data?.name) {
                    const nameData = overview.data.data.name;
                    const dob = nameData?.birthDate?.date || null;
                    obj.dob = dob ? new Date(dob) : null;
                    obj.bio = nameData?.bio?.text?.plainText || null;
                    act.dob = obj.dob; // If needed in the `actors` array
                } else {
                    obj.dob = null;
                    obj.bio = null;
                }
            } catch (overviewError) {
                console.error(`Failed to fetch overview for ${act.personId}:`, overviewError);
                obj.dob = null;
                obj.bio = null;
            }

            return obj;
        };

        const results = await Promise.all(actors.map(fetchActorOverview));
        personArray.push(...results);

        await jobs.update(jobId, "SET", {
            completionPercentage: 50
        });

    } catch (e) {
        throw e;
    }
}
export default {
    getSearch,
    getMovieObj,
    getPersonObj
}