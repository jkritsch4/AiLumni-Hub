import "./assets/main.css";
import { createApp } from "vue";
// import Amplify and outputs if you need them, otherwise remove the next two lines
// import { Amplify } from "aws-amplify";
// import outputs from "../amplify_outputs.json";
// Amplify.configure(outputs);
import App from "./App.vue";

createApp(App).mount("#app");