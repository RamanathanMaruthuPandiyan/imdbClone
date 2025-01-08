import axios from 'axios';

export const registerAuthListeners = (Auth) => {

    const setHeaders = (Auth) => {
        let token = "Bearer " + Auth.token;
        axios.defaults.headers.common['Authorization'] = token;
        axios.defaults.headers.common['userDetails'] = JSON.stringify(Auth.tokenParsed);
    }

    Auth.onReady = () => {
        console.log("Adapter is initialized on " + new Date());
    };

    Auth.onAuthSuccess = () => {
        console.log("User is successfully authenticated on " + new Date());
        setHeaders(Auth);
    };

    Auth.onAuthError = () => {
        console.log("Error during authentication");
    };

    Auth.onAuthRefreshSuccess = () => {
        console.log("Auth refresh success on " + new Date());
    };

    Auth.onAuthRefreshError = () => {
        console.log("Auth refresh error");
    };

    Auth.onAuthLogout = () => {
        console.log("Auth logout successfully");
    };

    Auth.onTokenExpired = function () {
        console.log("Token expired on " + new Date());
        var successCallback = (function successCallback() {
            return function (refreshed) {
                if (refreshed) {
                    setHeaders(Auth);
                    console.log("Token refreshed on " + new Date());
                }
            };
        })();
        Auth.updateToken().then(successCallback).catch(function () {
            Auth.logout();
        });
    };



}