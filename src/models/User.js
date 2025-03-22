const { Sequelize, DataTypes } = require('sequelize');
const Order = require('./Order'); 

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
      },
      // orders: {
      //   type: DataTypes.ARRAY(DataTypes.INTEGER),
      //   defaultValue: [],
      // },
      login: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
      },
      role: {
        type: DataTypes.STRING,
      },
    },
    
    {
        associations: () => {
            User.belongsToMany(Order, { through: 'UserOrder' });
        }
    },
    {
        timestamps: false
    }
  );

  return User;
};