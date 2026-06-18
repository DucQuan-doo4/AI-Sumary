import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import "./index.css";
import AppLayout from "./layouts/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MeetingList from "./pages/MeetingList.jsx";
import CreateMeeting from "./pages/CreateMeeting.jsx";
import MeetingDetail from "./pages/MeetingDetail.jsx";
import TaskList from "./pages/TaskList.jsx";
import TaskDetail from "./pages/TaskDetail.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import Notifications from "./pages/Notifications.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/meetings", element: <MeetingList /> },
          { path: "/meetings/new", element: <CreateMeeting /> },
          { path: "/meetings/:id", element: <MeetingDetail /> },
          { path: "/tasks", element: <TaskList /> },
          { path: "/tasks/:id", element: <TaskDetail /> },
          { path: "/notifications", element: <Notifications /> },
          { path: "/users", element: <UserManagement /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
