import DashboardView from "../Pages/DashboardView";
import ProjectsView from "../Pages/ProjectsView";
import { Routes, Route } from "react-router-dom";


const RoutesMain = () => {

    return (
        <Routes>
            
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/projects" element={<ProjectsView />} />

        </Routes>
    );
};

export default RoutesMain;