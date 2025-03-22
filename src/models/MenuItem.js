const { Sequelize, DataTypes } = require('sequelize');
// const sequelize = require('./db');

module.exports = (sequelize) => {
  const MenuItem = sequelize.define(
    'MenuItem',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
      },
      picture: {
        type: DataTypes.STRING,
      },
      cost: {
        type: DataTypes.FLOAT,
      },
      callQuantity: {
        type: DataTypes.FLOAT,
      },
      description: {
        type: DataTypes.STRING,
      }
    },
    {
      timestamps: false
    }
  );

  return MenuItem;
};