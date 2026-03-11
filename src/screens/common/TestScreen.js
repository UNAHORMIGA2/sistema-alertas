import axios from "axios";

const api = axios.create({

baseURL:"https://backend-emergencias.onrender.com/api",

timeout:10000,

headers:{
"x-plataforma":"mobile"
}

});

export default api;
