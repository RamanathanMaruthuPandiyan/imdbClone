import React, { useEffect, useContext, createContext } from 'react';
import { useKeycloak } from "keycloak-react-web";
import App from '../App.js';
import Loader from '../components/Loader.js';

export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const InitiateKeycloak = () => {

    const { keycloak, initialized } = useKeycloak();

    useEffect(() => {
        if (initialized) {
            if (!keycloak.authenticated) {
                keycloak.login();
            }
        }
    }, [initialized, keycloak]);

    if (!initialized) {
        return <Loader loading={true}></Loader>;
    }

    if (!keycloak.authenticated) {
        return <Loader loading={true}></Loader>;;
    }
    return (

        <AppContext.Provider value={{ keycloak }}>
            <App />
        </AppContext.Provider>
    );
};
export default InitiateKeycloak;
