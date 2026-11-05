import axios from "axios";

const api = axios.create({
  baseURL: "https://edu-mentor-1.onrender.com/api",
});

export default api;