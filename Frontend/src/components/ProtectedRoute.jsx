import Loader from "./Loader";
import { useAuthStore } from "../store/useAuthStore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({children}){
    const {user, loading} = useAuthStore();
    
    if (loading) {
        return <Loader />;
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
}