import { createContext, useEffect, useState } from "react";
import { api } from "../services/api.js";


export const AdminContext = createContext({});

export const AdminProvider = ({ children }) => {
    const [ projects, setProjects ] = useState([]);

    const getProjects = async () => {
        try {
            const response = await api.get("/manejos");
            setProjects(response.data);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    }

    useEffect(() => {
        getProjects();
    }, []);


    return (
        <AdminContext.Provider value={{
            projects,
        }}>
            {children}
        </AdminContext.Provider>
    );
};