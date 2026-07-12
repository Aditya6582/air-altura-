This is a basic Node.js project template, which anyone can use as it has been prepared by keeping some of the most important code principles and project management recommendations. Feel free to change anything.

---

## Project Structure

`src` — Inside this folder lives all the actual source code of the project, not including tests.

### Inside `src`:

- `config` — Anything and everything regarding configurations or setup of a library/module. For example: setting up `dotenv` so that we can use env vars anywhere in a cleaner fashion.

- `routes` — Register a route and its corresponding middleware.

- `middlewares` — Intercept incoming requests. Write your validators, authenticators, etc. here.

- `controllers` — Receive incoming requests and data, pass it to the business layer, then structure the API response and send it back.

- `repositories` — All logic that interacts with the DB — raw queries or ORM queries go here.

- `services` — Contains the business logic and interacts with repositories for data from the database.

- `utils` — Helper methods, error classes, etc.

---

## Setup the Project

1. Download this template from GitHub
2. Go inside the folder and run `npm i`
3. In the root directory, create a `.env` file and add the following:
    ```
    PORT=<port of your choice>
    ```
4. Go into the `src` folder and run `npx sequelize init` — this will generate `config.json`, `migrations`, and `seeders`
5. Set up the `config.json` with your DB credentials
6. To run the server: `npm run dev`
