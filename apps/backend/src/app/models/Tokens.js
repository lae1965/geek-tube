import { DataTypes } from 'sequelize';
import { sequelize } from "../dbConfig/db";

export const Token = sequelize.define('Token', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
  }, {
    timestamps: false,
  }
);
