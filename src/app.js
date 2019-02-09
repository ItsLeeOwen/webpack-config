export default class App {
  static Var = "Hello"

  greet = (...greetings) => {
    console.log("hello:", ...greetings)
  }
}
