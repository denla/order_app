const sequelize = require("./db"); // Assuming you have a sequelize.js file that sets up the Sequelize instance

const User = require("./models/User")(sequelize);
const Order = require("./models/Order")(sequelize);
const MenuItem = require("./models/MenuItem")(sequelize);

// Check the database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

// Sync the database with the models
(async () => {
  try {
    await sequelize.sync();
    console.log("Database has been synchronized successfully.");
  } catch (error) {
    console.error("Failed to synchronize the database:", error);
  }
})();
