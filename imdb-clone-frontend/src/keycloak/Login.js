import { KeycloakProvider } from "keycloak-react-web"
import Keycloak from 'keycloak-js';
import InitiateKeycloak from './InitiateKeycloak.js'
import { registerAuthListeners } from "./registerAuthListeners.js";
import { useEffect, useState } from "react";
import { getData } from "../services/ApiServices.js";


const Login = () => {

    const [authInstance, SetAuthInstance] = useState();
    const [keycloakInitOptions, setkeycloakInitOptions] = useState({
        onLoad: 'login-required',
        checkLoginIframe: true,
        checkLoginIframeInterval: 1,
        responseMode: 'fragment',
        pkceMethod: 'S256'
    });

    const init = async () => {

        try {
            let result = await getData("auth/config")
            if (result) {
                let keycloakSetting = {
                    realm: result.realmName,
                    url: result.baseUrl,
                    clientId: result.clientId
                };
                const authInstance = new Keycloak(keycloakSetting);

                SetAuthInstance(authInstance)

                registerAuthListeners(authInstance);

            }
        } catch (error) {
            console.log("Error while get config.", error);
        }

    };

    useEffect(() => {
        init()
    }, []);

    return (
        authInstance &&
        <KeycloakProvider client={authInstance} initOptions={keycloakInitOptions}>
            <InitiateKeycloak />
        </KeycloakProvider>
    )
};

export default Login;
