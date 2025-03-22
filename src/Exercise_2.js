const sequelize = require("./db.js");

const User = require("./models/User.js")(sequelize);
const Order = require("./models/Order.js")(sequelize);
const MenuItem = require("./models/MenuItem.js")(sequelize);

const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const cookieParser = require("cookie-parser");

const bcrypt = require("bcrypt");

// const sequelize = require('./db');
// const Order = require('./Order')(sequelize);
// const MenuItem = require('./MenuItem')(sequelize);
// const sequelize = require('./db');

// Order.belongsToMany(MenuItem, { through: 'OrderMenuItem' });
Order.belongsToMany(MenuItem, { through: "OrderMenuItem" });
MenuItem.belongsToMany(Order, { through: "OrderMenuItem" });
Order.belongsTo(User, { foreignKey: "waiter", as: "Waiter" });

//Cессии
// const session = require('session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// настройка сессии
app.use(
  session({
    store: new FileStore(),
    secret: "secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 3600000, // время жизни сессии в миллисекундах (1 час)
    },
  })
);

// настройка парсера cookie
app.use(cookieParser());

// ------------------
// HANDLEBARS
const exphbs = require("express-handlebars");
// const { default: axios } = require('axios');

const hbs = exphbs.create({
  defaultLayout: "main",
  extname: "hbs",
  allowProtoMethodsByDefault: true,
});

// Установка Handlebars как шаблонизатора по умолчанию
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

const Handlebars = require("handlebars");

Handlebars.registerHelper("sumCost", function (menuItems) {
  var sum = 0;
  menuItems.forEach(function (item) {
    sum += item.dataValues.cost;
  });
  return sum;
});

Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

Handlebars.registerHelper("not", function (context) {
  return !context;
});

Handlebars.registerHelper("orderDate", function (date) {
  const formattedDate = date
    .toLocaleDateString("ru-RU", {
      month: "long",
      day: "2-digit",
    })
    .toLowerCase();
  const formattedTime = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDateTime = `${formattedDate}, ${formattedTime}`;
  return formattedDateTime;
});

// Определение пути к папке с шаблонами
app.set("views", "views");

// Menu
app.get("/menu", (req, res) => {
  // console.log(req.session);
  MenuItem.findAll()
    .then((data) => res.render("menu", { items: data }))
    .catch((err) => {
      console.error(err);
      res.status(500).send("Server error");
    });
});

app.get("/", (req, res) => {
  Order.findAll({
    include: [
      {
        model: MenuItem,
        through: { attributes: [] }, // исключить атрибуты таблицы соединения
      },
      {
        model: User,
        as: "Waiter", // указать псевдоним для модели User
        attributes: ["name"], // указать атрибуты, которые нужно вывести
      },
    ],
  })
    .then((data) => {
      res.render("orders", { items: data, session: req.session });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Server error");
    });
});

app.get("/orders/:id", (req, res) => {
  Order.findByPk(req.params.id, {
    include: [
      {
        model: MenuItem,
        through: { attributes: [] }, // исключить атрибуты таблицы соединения
      },
    ],
  })
    .then((data) => {
      console.log(data);
      res.render("order", { order: data, menuItems: data.MenuItems });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Server error");
    });
});

app.get("/orders", (req, res) => {
  MenuItem.findAll().then((MenuItems) => {
    User.findAll()
      .then((users) => {
        res.render("form", { MenuItems, users, session: req.session });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Server error");
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Server error");
      });
  });
});

app.post("/orders", (req, res) => {
  Order.create(req.body)
    .then((order) => {
      console.log("req.body.items:", req.body.items);
      order
        .addMenuItem(req.body.items)
        .then(() => {
          console.log("addMenuItem вызван");
          res.json(order);
        })
        .catch((err) => {
          console.log("Ошибка при вызове addMenuItem:", err);
          res.status(400).json(err);
        });
    })
    .catch((err) => res.status(400).json(err));
});

app.post("/items", (req, res) => {
  MenuItem.create(req.body)
    .then((data) => res.json(data))
    .catch((err) => res.status(400).json(err));
});

app.put("/orders/:id", (req, res) => {
  Order.update(req.body, { where: { id: req.params.id } })
    .then((data) => res.json(data))
    .catch((err) => res.status(400).json(err));
});

app.delete("/orders/:id", (req, res) => {
  Order.update({ isActive: false }, { where: { id: req.params.id } })
    .then((data) => res.json(data))
    .catch((err) => res.status(400).json(err));
});

app.post("/users", (req, res) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }
  bcrypt
    .hash(password, 10)
    .then((hashedPassword) => {
      req.body.password = hashedPassword;
      User.create(req.body)
        .then((user) => {
          res.json(user);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ error: "Error creating user" });
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Error hashing password" });
    });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { login, password } = req.body;
  User.findOne({ where: { login } })
    .then((user) => {
      if (user) {
        bcrypt
          .compare(password, user.password)
          .then((isValid) => {
            if (isValid) {
              req.session.userId = user.id;
              req.session.userName = user.login;
              req.session.userRole = user.role;
              console.log("session");
              console.log(req.session);
              req.session.save((err) => {
                if (err) {
                  console.error(err);
                }
                res.json({ isValid: true });
              });
            } else {
              res.json({ isValid: false });
            }
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        res.json({ isValid: false });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Ошибка входа" });
    });
});

app.get("/signup", (req, res) => {
  res.render("registration");
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/login");
  });
});

app.post("/waiters", (req, res) => {
  console.log(req.body);
  User.create(req.body)
    .then((data) => res.json(data))
    .catch((err) => res.status(400).json(err));
});

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

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
