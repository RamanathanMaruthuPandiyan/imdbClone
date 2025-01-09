import { Router } from "express";
import jobs from "../services/jobs.js";
import { authorize, ROLES } from "../middleware/auth.js";
const router = Router();


router.post("/pagination", authorize([ROLES.A]), async function (req, res) {
    try {
        let filter = req.body.filter || {};
        let skip = req.body.skip || 0;
        let limit = req.body.limit || 15;
        let search = req.body.search || "";
        let sort = req.body.sort || { "dates.created": -1 };

        let result = await jobs.pagination(filter, skip, limit, search, sort);
        res.send(result);
    } catch (e) {
        appLogger.error("Error while fetching jobs pagination.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});


export default router;
