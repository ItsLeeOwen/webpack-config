import "./index.scss"

const app = new App()
app.greet("dzień dobry", "hello", process.env.GREETING)

export default class App {
  static Var = "Hello"

  greet = (...greetings) => {
    console.log("hello:", ...greetings)
  }
}
