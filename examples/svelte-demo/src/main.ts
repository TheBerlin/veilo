// main.ts: mounts the demo.

import { mount } from "svelte";
import App from "./App.svelte";
import "./styles.css";

mount(App, { target: document.getElementById("app")! });
