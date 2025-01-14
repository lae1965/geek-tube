import bcrypt from 'bcrypt';
import { v4 as uuidV4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import remove from 'remove';

import { ApiError } from '../errors/apiError.js';
import tokenService from './token.service.js';
import mailService from './mail.service.js';
import { userQueries } from '../queries/UserQueries.js';
import { tokenQueries } from '../queries/TokenQueries.js';
import { imageExtensions } from '../util/videoImageExtensions.js';
import { removeFile } from '../gRPC/removeFile.grpc.js';
import { sendMediaToBack } from '../gRPC/sendMediaToBack.grpc.js';
import { channelQueries } from "../queries/ChannelQueries";

class UserService {
  async getAll() {
    return userQueries.findAllUsers();
  }

  async getOneById(id) {
    let user = await userQueries.findOneById(id);
    if (!user) {
      throw ApiError.NotFound(`Пользователь с id ${id} не найден`);
    }
    delete user.activateLink;
    delete user.password;
    for (const key in user) {
      if (user[key] === null) user[key] = "";
    }
    return user;
  }

  async registration(nickName, email, password) {
    try {
      password = await bcrypt.hash(password, 5);
      const activateLink = uuidV4();

      const newUserId = await userQueries.createUser(nickName, email, password, activateLink);
      const tokenObject = await tokenService.createNewTokens({id: newUserId, nickName, email, role: 'user'});
      await mailService.sendActivationMail(email, `${process.env.API_URL}/api/user/activate/${activateLink}`);
      return {id: newUserId, ...tokenObject};
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  async login(email, password) {
    try {
      const newUser = await userQueries.findOneByEmail(email);
      if (!newUser) {
        throw ApiError.UnAuthorization(`Пользователя с email ${email} не существует`);
      }
      const isEqual = await bcrypt.compare(password, newUser.password);
      if (!isEqual) {
        throw ApiError.UnAuthorization('Неправильный пароль');
      }
      delete newUser.password;
      delete newUser.activateLink;
      const tokenObject = await tokenService.createNewTokens({
        id: newUser.id,
        nickName: newUser.nickName,
        email: newUser.email,
        role: newUser.role,
      });
      return {newUser, tokenObject};
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  async logout(refreshTokenId) {
    try {
      const result = await tokenQueries.removeToken(refreshTokenId);
      if (!result) {
        throw ApiError.InternalServerError('Error! Can\'t logout');
      }
      return result;
    } catch (e) {
      console.log(e.message);
    }
  }

  async refresh(refreshToken) {
    try {
      const user = tokenService.validateToken(refreshToken, true);
      if (!user) throw ApiError.UnAuthorization('RefreshToken не валиден. Возможно он просрочен');

      const refreshTokenFromDB = await tokenQueries.findByToken(refreshToken);
      if (!refreshTokenFromDB) throw ApiError.UnAuthorization('RefreshToken не найден в базе');

      const userFromDB = await userQueries.findOneById(user.id);
      if (!userFromDB) throw ApiError.UnAuthorization('Пользователя с таким refreshToken не существует в базе');

      return {
        ...await tokenService.createNewTokens(
          {
            id: userFromDB.id,
            nickName: userFromDB.nickName,
            email: userFromDB.email,
            role: userFromDB.role,
          },
          refreshTokenFromDB.id,
        ),
        isBaned: userFromDB.isBaned,
      };
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  async changePassword(id, oldPassword, newPassword, refreshTokenId) {
    try {
      const user = await userQueries.checkUserById(id);
      if (!user) throw ApiError.NotFound(`Пользователь с id ${id} не найден`);

      const DBPassword = await userQueries.getPasswordByUserId(id);
      if (!(await bcrypt.compare(oldPassword, DBPassword))) {
        throw ApiError.Conflict('Неправильный пароль');
      }
      newPassword = await bcrypt.hash(newPassword, 5);
      if (!(await userQueries.updateUser(id, {password: newPassword}))) {
        throw ApiError.InternalServerError('Не удалось сменить пароль');
      }
      // Далее разлогиниваем текущего User на других устройствах
      await tokenQueries.removeOtherDevicesTokens(id, refreshTokenId);
      return {message: 'Замена пароля прошла успешно'};
    } catch (e) {
      console.log(e.message);
      throw(e);
    }
  }

  async edit(id, updatingUser) {
    return await userQueries.updateUser(id, updatingUser);
  }

  async activate(link) {
    try {
      const user = await userQueries.findOneByActivateLink(link);
      if (!user) {
        throw ApiError.BadRequest('Пользователь по ссылке не найден. Возможно ссылка устарела.');
      }
      await userQueries.updateUser(user.userId, {isActivate: true});
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  async remove(id) {
    const videoIdArr = await channelQueries.findAllUserChannelsId(id);
    await Promise.all(videoIdArr.map(value => value.map(value => removeFile(value))));
    if (!userQueries.deleteUser(id)) {                  // удаляет Users, UserInfos, Tokens
      throw ApiError.InternalServerError('Can\'t remove user');
    }
    return id;
  }

  async uploadAvatar(id, files) {
    try {
      if (!files) {
        throw ApiError.BadRequest('Отсутствует файл аватара для загрузки');
      }
      const file = files.avatarFile;
      const extension = path.extname(file.name);

      if (!imageExtensions.includes(extension)) {
        throw ApiError.BadRequest('Формат файла не соответствует формату фотографии');
      }

      const user = userQueries.checkUserById(id);
      if (!user) throw ApiError.NotFound(`Пользователь с id ${id} не найден`);

      const oldAvatar = await userQueries.getUserAvatarById(id);              // Проверяем нет ли у юзера аватарки
      if (oldAvatar) {
        removeFile(oldAvatar);                                                // Если есть - удаляем
      }
      const hashName = uuidV4() + extension;
      const tempFilePath = path.resolve(path.dirname(file.tempFilePath), hashName);
      fs.renameSync(file.tempFilePath, tempFilePath);
      return sendMediaToBack(tempFilePath, hashName, async () => {                 // Сохраняем аватарку на VDS-сервер
        const result = await userQueries.updateUser(id, {avatar: hashName});     //Прописываем имя файла сохраненной аватарки в userInfos
        await remove('tmp', {verbose: true, ignoreErrors: false}, err => {
          if (err) console.log(err.message);
        });
        return result;
      });

    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  async getAvatarName(id) {
    try {
      return await userQueries.getUserAvatarById(id);
    } catch {
      return null;
    }
  }

  async removeAvatar(id) {
    try {
      const avatarName = await userQueries.getUserAvatarById(id);
      if (!avatarName) {
        throw ApiError.NotFound('У данного пользователя нет аватара');
      }
      removeFile(avatarName);
      return await userQueries.updateUser(id, {avatar: null});
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }

  async isNickNameUnique(nickName) {
    return await userQueries.isNickNameUnique(nickName);
  }

  async isEmailUnique(email) {
    return await userQueries.isEmailUnique(email);
  }

  async getNickNameById(id) {
    try {
      const nickName = await userQueries.getNickNameById(id);
      if (!nickName) {
        throw ApiError.NotFound(`Пользователь с id ${id} не найден`);
      }
      return nickName;
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }
}

export default new UserService();
