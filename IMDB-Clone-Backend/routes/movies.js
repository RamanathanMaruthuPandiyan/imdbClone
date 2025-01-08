import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import movies from "../services/movies.js";
import imdb from "../services/remote/imdb.js";
import { ObjectId } from "../daos/MongoDbConnection.js";
import { authorize, ROLES } from "../middleware/auth.js";

const router = Router();

router.post("/imdb/import", authorize([ROLES.A]), async (req, res) => {
    try {
        let imdbId = req.body.imdbId;
        let name = req.body.name;
        let yearOfRelease = req.body.yearOfRelease;
        let poster = req.body.poster || "";
        let actors = req.body.actors || [];

        if (!imdbId || !name || !Number.isFinite(yearOfRelease)) {
            throw new Error("Mandatory fields are missing for the import operation.");
        }

        await movies.importFromImdb(res, imdbId, name, yearOfRelease, poster, actors);
    } catch (e) {
        appLogger.error("Error while importing the data from imdb.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.post("/pagination", authorize([ROLES.A]), async (req, res) => {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { id: -1 };

        let result = await movies.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching data for movies pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.post("/", authorize([ROLES.A]), async (req, res) => {
    try {
        let dataObj = movies.validatePayload(req.body);
        let result = await movies.addMovie(dataObj);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while creating the movie.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/action/items/:id", authorize([ROLES.A]), async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mondatory id field is missing.");
        }
        let result = await movies.getActionItems(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while getting the action items for the movie id.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/filter/options", authorize([ROLES.A]), async (req, res) => {
    try {
        let result = await movies.getFilterOptions();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while getting filter options.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/dropdown/persons", authorize([ROLES.A]), async (req, res) => {
    try {
        let result = await movies.getDropdown();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while retrieving the dropdown data.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/imdb/search", authorize([ROLES.A]), async (req, res) => {
    try {
        let searchTerm = req.query.searchTerm;
        let type = req.query.type || "MOVIE";
        let limit = req.query.limit || 10;
        let language = req.query.language || "en-US"

        let result = await imdb.getSearch(searchTerm, type, parseInt(limit), language);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while searching data in the IMDB server.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/:id", authorize([ROLES.A]), async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mandatory id field is missing.");
        }

        let result = await movies.getMovie(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while retrieving the movie.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.put("/:id", authorize([ROLES.A]), async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mandatory id field is missing.");
        }
        let dataObj = movies.validatePayload(req.body);
        let result = await movies.updateMovie(ObjectId(id), dataObj);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating the movie.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.delete("/:id", authorize([ROLES.A]), async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mandatory id field is missing.");
        }
        let result = await movies.deleteMovie(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while deleting the movie.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;