import { Router } from "express";
import appLogger from "../logging/appLogger.js";
import persons from "../services/persons.js";
import { ObjectId } from "../daos/MongoDbConnection.js";
const router = Router();

router.post("/pagination", async function (req, res) {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { id: -1 };

        let result = await persons.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching data for persons pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});


router.post("/", async function (req, res) {
    try {
        let dataObj = persons.validatePayload(req.body);
        let result = await persons.addPerson(dataObj);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while saving the persons details.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/action/items/:id", async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mondatory id field is missing.");
        }
        let result = await persons.getActionItems(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while creating the given person id.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/filter/options", async (req, res) => {
    try {
        let result = await persons.getFilterOptions();
        res.send(result);
    } catch (e) {
        appLogger.error("Error while getting filter options.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mandatory id field is missing.");
        }

        let result = await persons.getPerson(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while retrieving the person.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.put("/:id", async function (req, res) {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mandatory id field is missing.");
        }
        let dataObj = persons.validatePayload(req.body);
        let result = await persons.updatePerson(ObjectId(id), dataObj);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while updating the person's details.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

router.delete("/:id", async function (req, res) {
    try {
        let id = req.params.id;
        if (!id) {
            throw new Error("Mandatory id field is missing.");
        }
        let result = await persons.deletePerson(ObjectId(id));
        res.send(result);
    } catch (e) {
        appLogger.error("Error while deleting the person's details.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});
export default router;