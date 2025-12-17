import axios from "axios";

export const api = axios.create({
    baseURL: "https://arpt.site/api",
    timeout: 8 * 1000,
});