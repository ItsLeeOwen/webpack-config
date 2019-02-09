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

Add environment variables to your project, accessible on `process.env`. Example: `process.env.GREETING`.

```json
"webpack": {
	"entry": {
		"index.html": "./src/index.html",
		"index.js": "./src/index.js"
	},
	"env": {
		"GREETING": "cześć",
		"GREETING_FROM_ENV": "$GREETING_FROM_ENV"
	}
}
```

Values prefixed with `$` will be assigned from your environment.
Source environment variables from a `.env` file at the root of your project:

```sh
GREETING_FROM_ENV=alo
```
