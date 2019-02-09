import "./index.scss"

export const hello = (...greetings) => {
  console.log("hello:", ...greetings)
}

hello("dzień dobry", "hello", process.env.GREETING)
