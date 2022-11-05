import axios from "axios";

const http = axios.create({
  baseURL: "http://143.107.183.74:11480/",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default http;
