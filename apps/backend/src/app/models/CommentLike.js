import { DataTypes } from 'sequelize';
import { sequelize } from "../dbConfig/db";

export const CommentLike = sequelize.define('CommentLikes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    liked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    timestamps: false,
  }
);