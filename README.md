```sh
npm i --save webpack-config-starter
```

Add a webpack.config.js file to the root of your project and include:

```javascript
module.exports = require("webpack-config-starter")
```

Add a webpack block to package.json with your entry files:

```json
"webpack": {
	"entry": {
		"index.html": "./src/index.html",
		"index.js": "./src/index.js"
	},
}
```

Want to expose environment variables to your javascript? Use a .env file in the root of your project. The variables will be accessible on `process.env`, such as `process.env.PUBLIC_KEY`.

```sh
PUBLIC_KEY=asdf
```
