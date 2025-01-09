import { createRequire } from 'module';
const loadModule = createRequire(import.meta.url);
const settings = loadModule(`../config/config.${process.env.NODE_ENV}.json`);
import axios from 'axios';
import logger from '../logging/appLogger.js';

const skipAuthIds = new Set(Object.values(settings.authServerConfig.skipIds));
const ROLE_MAPPING = Object.freeze({
    "A": "ADMIN",
});

function assignUserRoleAttributes(user) {
    if (user && user.userRoles) {
        user.isAdmin = user.userRoles.has(ROLE_MAPPING.A);
    }
    return user;
}

function authenticate(req, res, next) {
    if (!settings.authServerConfig.validateToken || skipAuthIds.has(req.headers.authorization)) {
        req.headers.userdata = { userRoles: new Set(["ADMIN"]), username: "ADMIN" };
        assignUserRoleAttributes(req.headers.userdata);
        next();
        return;
    }

    const requestOptions = {
        method: 'POST',
        url: settings.authServerConfig.baseUrl + settings.authServerConfig.tokenValidationPath,
        headers: {
            'Cache-Control': 'no-cache',
            'authorization': req.headers.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        resolveWithFullResponse: true,
        form: {}
    };

    axios(requestOptions)
        .then(response => handleResponse(response, req, res, next))
        .catch(error => handleError(error, res));
}

function handleResponse(response, req, res, next) {
    if (response.status === 200) {
        req.headers.userdata = response.data;
        req.headers.userdata.username = req.headers.userdata.preferred_username.toUpperCase();
        req.headers.userdata.userRoles =
            req.headers?.userdata?.resource_access?.[settings.authServerConfig.clientId]?.roles || [];

        if (Array.isArray(req.headers.userdata.userRoles)) {
            req.headers.userdata.userRoles = new Set(req.headers.userdata.userRoles);
        }

        req.headers.userdata.ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || "";
        assignUserRoleAttributes(req.headers.userdata);
        next();
    } else {
        logger.error("Token verification failed", response.statusText);
        res.status(500).send({ name: response.status, message: response.statusText });
    }
}

function handleError(error, res) {
    res.status(500).send({ name: error.name, message: error.message });
}

function authorize(allowedRoles = []) {
    return [authenticate, (req, res, next) => {
        if (!settings.authServerConfig.validateToken || skipAuthIds.has(req.headers.authorization)) {
            next();
            return;
        }

        if (!allowedRoles.length) {
            next();
            return;
        }

        if (!req.headers.userdata || !req.headers.userdata.userRoles || !req.headers.userdata.userRoles.size) {
            logger.error("Missing user data", JSON.stringify(req.headers.userdata));
            return res.status(403).json({ message: 'Access denied' });
        }

        const matchedRoles = allowedRoles.filter(role => req.headers.userdata.userRoles.has(role));
        if (!matchedRoles.length) {
            logger.error("User role not authorized", JSON.stringify(req.headers.userdata));
            return res.status(403).json({ message: 'Access denied' });
        }

        next();
    }];
}

const _authenticate = authenticate;
const _authorize = authorize;
export { _authenticate as authenticate, _authorize as authorize };
export const ROLES = ROLE_MAPPING;
