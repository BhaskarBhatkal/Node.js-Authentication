import connectDB from "./DB/index.database.js";
import app from "./app.js";

const port = process.env.PORT;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log("Server is running on port: ", port);
    });
  })
  .catch((err) => {
    console.log("Error occured while connecting server: ", err);
  });
