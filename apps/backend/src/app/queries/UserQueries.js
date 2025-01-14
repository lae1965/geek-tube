/* eslint-disable no-useless-catch */
import { Op } from 'sequelize';

import { User } from "../models/Users";
import { UserInfo } from "../models/UserInfo";
import { ApiError } from "../errors/apiError";

class UserQueries {
  parsingQueryModel(modelFromQuery) {
    modelFromQuery = modelFromQuery.toJSON();
    const user = {
      ...modelFromQuery.UserInfo,
      id: modelFromQuery.id,
      nickName: modelFromQuery.nickName,
    };
    delete user.userId;
    delete user.updateTimestamp;
    return user;
  }

  async createUser(nickName, email, password, activateLink) {
    try {
      if (await User.findOne({where: {nickName}})) {
        throw ApiError.Conflict(`Пользователь с именем ${nickName} уже существует!`);
      }
      if (await UserInfo.findOne({where: {email}})) {
        throw ApiError.Conflict(`Пользователь с email ${email} уже существует!`);
      }
      const userId = (await User.create({nickName})).dataValues.id;
      await UserInfo.create({email, password, activateLink, userId: userId});
      return userId;
    } catch (e) {
      console.log('Ошибка в userQueries.createUser!');
      throw (e);
    }
  }

  /**
   * Проверка на существование пользователя
   * @param {string} nickName - nickName пользователя
   * @returns {boolean}
   */
  async checkUser(nickName) {
    return !!(await this.findOneByName(nickName));
  }

  /**
   * Поиск пользователя по id
   * @param {number} id - id пользователя
   * @returns {Object}
   */
  async findOneById(id) {
    try {
      let result = await User.findOne(
        {
          where: {id},
          include: [
            {
              model: UserInfo,
            },
          ],
        },
      );
      if (result) result = this.parsingQueryModel(result);
      return result;
    } catch (e) {
      throw ApiError.InternalServerError(e);
    }
  }

  async getPasswordByUserId(id) {
    try {
      const password = await UserInfo.findOne({
        attributes: ['password'],
        where: {userId: id},
      });
      if (!password) {
        throw ApiError.NotFound(`Пользователь с id ${id} не найден.`);
      }
      return password.toJSON().password;
    } catch (e) {
      throw(e);
    }
  }

  /**
   * Поиск пользователя по nickName
   * @param nickName - nickName пользователя
   * @returns {Object}
   */
  async findOneByName(nickName) {
    return await (User.findOne(
      {
        where: {
          nickName: nickName,
        },
        include: [
          {
            model: UserInfo,
          },
        ],
      },
    ));
  }

  async findOneByEmail(email) {
    try {
      let result = (await User.findOne({include: [{model: UserInfo, where: {email}}]}));
      if (result) result = this.parsingQueryModel(result);
      return result;
    } catch (e) {
      throw(e);
    }
  }

  async findOneByActivateLink(activateLink) {
    try {
      let result = await UserInfo.findOne({where: {activateLink}});
      if (result) result = result.dataValues;
      return result;
    } catch (e) {
      throw(e);
    }
  }

  /**
   * Поиск всех пользователей
   * @returns {Object[]}
   */
  async findAllUsers() {
    try {
      const users = await User.findAll(
        {
          include: [
            {
              model: UserInfo,
            },
          ],
        },
      );
      if (!users) return null;
      const result = [];
      for (const user of users) {
        result.push(this.parsingQueryModel(user));
      }
      return result;
    } catch (e) {
      throw(e);
    }
  }

  async updateUser(id, data) {
    let updateCount = 0;
    try {
      if (data.nickName) {
        if (await User.findOne(
          {
            where: {
              [Op.and]: [
                {nickName: data.nickName},
                {id: {[Op.ne]: id}},
              ],
            },
          },
        )) {
          throw ApiError.Conflict(`Пользователь с именем ${data.nickName} уже существует!`);
        }
        updateCount += await User.update({nickName: data.nickName}, {where: {id}});
        delete data.nickName;
      }

      if (Object.keys(data).length) {
        updateCount += +(await UserInfo.update({...data}, {where: {userId: id}}));
      }
      return !!updateCount;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Удаление пользователя
   * @param {number} id - id пользователя
   * @returns {boolean}
   */
  async deleteUser(id) {
    try {
      if (await this.isUserById(id)) return !!(await User.destroy({where: {id}}))
      throw ApiError.NotFound('Указанного id пользователя не существует');
    } catch {
      return false;
    }
  }

  async isNickNameUnique(nickName) {
    return !(await User.findOne({where: {nickName}}));
  }

  async isEmailUnique(email) {
    return !(await UserInfo.findOne({where: {email}}));
  }

  async isUserById(id) {
    return !!(await User.findOne({where: {id}}))
  }

  async getUserAvatarById(id) {
    try {
      if (await this.isUserById(id)) {
        const result = await UserInfo.findOne(
          {
            attributes: ['avatar'],
            where: {userId: id},
          },
        );
        if (!result) return null;
        return result.toJSON().avatar;
      }
      throw ApiError.NotFound('Указанного id пользователя не существует');
    } catch (e) {
      throw(e);
    }
  }

  async getNickNameById(id) {
    try {
      const result = await User.findOne(
        {
          attributes: ['nickName'],
          where: {id},
        },
      );
      if (!result) return null;
      return result.toJSON().nickName;
    } catch (e) {
      throw(e);
    }
  }

  async checkUserById(id) {
    try {
      return !!(await User.findOne({where: {id}}));
    } catch (e) {
      throw e;
    }
  }
}

export const userQueries = new UserQueries();
