import App from "app"
import "./index.scss"

console.log("index.js")

const app = new App()
app.greet("dzień dobry", "hello", process.env.GREETING)
