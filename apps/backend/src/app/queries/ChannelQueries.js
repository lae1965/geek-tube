import { Channel } from "../models/Channel";
import { ChannelInfo } from "../models/ChannelInfo";
import { ChannelSubscriber } from "../models/ChannelSubscribers";
import { ApiError } from "../errors/apiError";
import { PlayList } from "../models/PlayList";
import { Video } from "../models/Video";
import { removeFile } from '../gRPC/removeFile.grpc.js';
import { VideoInfo } from "../models/VideoInfo";

class ChannelQueries {
  parsingQueryModel(modelFromQuery) {
    // modelFromQuery = JSON.parse(JSON.stringify(modelFromQuery));
    modelFromQuery = modelFromQuery.toJSON();
    return {
      ...modelFromQuery.ChannelInfo,
      id: modelFromQuery.id,
      title: modelFromQuery.title,
      userId: modelFromQuery.userId,
    };
  }

  /**
   * Добавление канала
   * @param {number} userId - id пользователя
   * @param {string} title - название канала
   * @param {string} description - описание канала
   * @returns {number} - id созданого канала
   */
  async createChannel(userId, title, description) {
    try {
      if (await Channel.findOne({where: {userId, title}})) {
        throw ApiError.Conflict(`Канал с именем "${title}" уже существует!`);
      }
      const cChannel = (await Channel.create({title, userId})).toJSON();
      await ChannelInfo.create({
        description,
        channelId: cChannel.id,
      });
      return cChannel.id;
    } catch (e) {
      console.log(e.message);
      throw (e);
    }
  }

  /**
   * Поиск канала по ID
   * @param {string} Id - имя канала
   * @returns {Object}
   */
  async findChannelById(Id) {
    try {
      const channel = await Channel.findOne({
        where: {Id},
        include: [{model: ChannelInfo, attributes: {exclude: ['channelId']}}],
      });
      if (!channel) {
        throw ApiError.Conflict('Канал с заданным id не найден');
      }
      return this.parsingQueryModel(channel);
    } catch (e) {
      console.log(e.message);
      throw(e);
    }
  }

  async isSubscriber(channel_id, user_id) {
    try {
      return !!(await ChannelSubscriber.findOne({where: {channelId: channel_id, userId: user_id}}));
    } catch (e) {
      console.log(e.message);
      throw(e);
    }
  }

  /**
   * Поиск всех каналов по ID
   * @returns {Object[]}
   */
  async findAllChannelByUserId(UserId) {
    try {
      const channels = await Channel.findAll(
        {
          where: {UserId},
          include: [{model: ChannelInfo, attributes: {exclude: ['channelId']}}],
        },
      );
      if (!channels) return null;
      const result = [];
      for (const channel of channels) {
        result.push(this.parsingQueryModel(channel));
      }
      return result;
    } catch (e) {
      console.log(e.message);
      throw(e);
    }
  }

  async findAllUserChannelsId(UserId) {
    const ChannelsId = await Channel.findAll({
      where: {UserId},
      attributes: {exclude: ['title', 'userId']},
      include: [{
        model: Video,
        attributes: {exclude: ['playListId', 'title', 'channelId']},
        include: [{
          model: VideoInfo,
          attributes: ['hashName'],
        }],
      }],
    });
    return ChannelsId.map(value => {
      return value.Videos.map(value => {
        return value.toJSON().VideoInfo.hashName;
      });
    });
  }

  /**
   * Добавление/Удаление подписки
   * @param {number} userId - id пользователя отписавшегося от канала
   * @param {number} channelId  id канала
   * @returns {boolean}
   */
  async subscriber(channelId, userId) {
    try {
      if (await this.isChannel(channelId)) {
        const subscribers = await ChannelInfo.findOne({where: {channelId}});
        console.log(subscribers);
        if (await ChannelSubscriber.findOne({where: {channelId, userId}})) {
          await ChannelSubscriber.destroy({where: {channelId, userId}});
          await subscribers.decrement('subscribersCount', {by: 1});
          return false;
        }
        await ChannelSubscriber.create({channelId, userId});
        await subscribers.increment('subscribersCount', {by: 1});
        return true;
      }
      throw ApiError.NotFound(`Канал с id '${channelId}' не найден`);
    } catch (e) {
      throw ApiError.InternalServerError(e.message);
    }
  }


  /**
   * Удаление канала
   * @param {number} id - id канала
   * @returns {boolean}
   */
  async deleteChannel(id) {
    try {
      return !!(await Channel.destroy({
        where: {id},
        include: [{model: ChannelInfo}, {model: PlayList}, {model: ChannelSubscriber}, {model: Video}],
      }));
    } catch (e) {
      return false;
    }
  }

  /**
   * Обновление канала
   * @param {number} id - id канала
   * @param {number} userId - id пользователя
   * @param {Object} data - данные о канале
   * @returns {boolean}
   */
  async updateChannel(id, userId, data) {
    let isUpdate = 0;
    try {
      if (data.title) {
        const uChannel = (await Channel.findOne({where: id})).toJSON();
        if (uChannel.title !== data.title) {
          if (await Channel.findOne({where: {userId, title: data.title}})) {
            throw ApiError.Conflict(`Канал с именем ${data.title} уже существует!`);
          }
          isUpdate += await Channel.update({title: data.title}, {where: {id}});
          delete data.title;
        }
      }
      if (Object.keys(data).length) {
        isUpdate += await ChannelInfo.update({...data}, {where: {channelId: id}});
      }
      return !!isUpdate;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async isChannel(id) {
    return !!(await Channel.findOne({where: {id}}));
  }

  async getSubscribedListByUserId(userId) {
    try {
      const channels = await Channel.findAll({
        attributes: ['id', 'userId'],
        include: [
          {
            model: ChannelSubscriber,
            where: {userId},
            attributes: {exclude: ['id', 'userId', 'channelId']},
          },
        ],
      });
      if (!channels) return null;
      return channels.map(channel => channel.toJSON());
    } catch (e) {
      console.log(e.message);
      throw e;
    }
  }
}

export const channelQueries = new ChannelQueries();
