import { DataTypes } from 'sequelize';
import { sequelize } from "../dbConfig/db";

export const ChannelInfo = sequelize.define('ChannelInfo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    description: {
      type: DataTypes.CHAR,
    },
    subscribersCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    timestamps: true,
    createdAt: 'createTimestamp',
    updatedAt: false,
  }
);
