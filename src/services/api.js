import axios from "axios";

export const api = axios.create({
    baseURL: "https://arpt.site/api",
    // baseURL: "http://localhost:4001",
    timeout: 8 * 1000,
});