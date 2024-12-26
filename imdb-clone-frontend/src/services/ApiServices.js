import axios from 'axios';
const baseURL = "http://localhost:8144";

/**
   * Custom hook to GET method
   * @param url
*/

axios.defaults.headers.common['Access-Control-Allow-Origin'] = baseURL;

export const getData = async (url, options = {}) => {
    try {
        const response = await axios.get(`${baseURL}/${url}`, {
            ...options,
            params: options.params || {},
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
   * Custom hook to POST method
   * @param url && @param data
*/

export const postData = async (url, data, options = {}) => {
    try {
        const response = await axios.post(`${baseURL}/${url}`, data, options);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
   * Custom hook to PUT method
   * @param url && @param updatedData
*/

export const putData = async (url, updatedData, options = {}) => {
    try {
        const response = await axios.put(`${baseURL}/${url}`, updatedData, options);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
   * Custom hook to DELETE method
   * @param url
*/

export const deleteData = async (url, data = {}) => {
    try {
        const response = await axios.delete(`${baseURL}/${url}`, { data });
        return response.data;
    } catch (error) {
        throw error;
    }
};
