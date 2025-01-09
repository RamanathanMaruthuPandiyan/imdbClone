import { Router } from "express";
import { Jobs, Sex, Action_Items } from "../enums/enums.js";
import { authorize, ROLES } from "../middleware/auth.js";
const router = Router();

const map = {
    "sex": Sex,
    "jobs": Jobs,
    "actionItems": Action_Items
}
router.get("/:enumName", authorize([ROLES.A]), async (req, res) => {
    try {
        let enumName = req.params.enumName;
        res.send(map[enumName]);
    } catch (e) {
        appLogger.error("Error while fetching enum by the given name.", e);
        res.status(500).send({ name: e.name, message: e.message });
    }
});

export default router;