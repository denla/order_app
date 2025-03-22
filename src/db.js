const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('s21_restaurant', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres'
});

module.exports = sequelize;