import { body, param, query } from 'express-validator';

import {
  NOT_DIGIT,
  NOT_EXISTS,
  NOT_INT,
  NOT_STRING,
  REG_EXP_FOR_DIGITS,
  REG_EXP_FOR_DIGITS_OR_EMPTY
} from '../util/validationMessages';
import { Validation } from './validation';

class VideoValidation extends Validation {
  constructor() {
    super();

    this.create.push(body('category').optional().isString().withMessage(NOT_STRING));

    this.createHistory = [
      param('userId').exists().withMessage(NOT_EXISTS).matches(REG_EXP_FOR_DIGITS).withMessage(NOT_DIGIT),
      param('videoId').exists().withMessage(NOT_EXISTS).matches(REG_EXP_FOR_DIGITS).withMessage(NOT_DIGIT),
    ];

    this.edit.push(body('updatingObject.category').optional().isString().withMessage(NOT_STRING));
    this.edit.push(body('updatingObject.playlistId').optional().isNumeric().withMessage(NOT_INT));

    this.checkName = [ param('hash_name').exists().withMessage(NOT_EXISTS) ];
    this.checkTitle = [ param('title').exists().withMessage(NOT_EXISTS) ];
    this.checkPlaylistId = [ param('playlist_id').exists().withMessage(NOT_EXISTS).matches(REG_EXP_FOR_DIGITS).withMessage(NOT_DIGIT) ];
    this.checkUserId = [ param('user_id').exists().withMessage(NOT_EXISTS).matches(REG_EXP_FOR_DIGITS).withMessage(NOT_DIGIT) ];
    this.checkParamsTitle = [ param('title').exists().withMessage(NOT_EXISTS) ];

    this.checkDownload = [
      query('hash_name').exists().withMessage(NOT_EXISTS),
      query('video_id').exists().withMessage(NOT_EXISTS).matches(REG_EXP_FOR_DIGITS).withMessage(NOT_DIGIT)
    ];

    this.getOne = [
      query('video_id').exists().withMessage(NOT_EXISTS).matches(REG_EXP_FOR_DIGITS).withMessage(NOT_DIGIT),
      query('user_id').exists().withMessage(NOT_EXISTS).matches(REG_EXP_FOR_DIGITS_OR_EMPTY).withMessage(NOT_DIGIT)
    ];

    this.removeOne = [
      query('video_id').exists().withMessage(NOT_EXISTS).matches(REG_EXP_FOR_DIGITS).withMessage(NOT_DIGIT),
      query('user_id').exists().withMessage(NOT_EXISTS).matches(REG_EXP_FOR_DIGITS).withMessage(NOT_DIGIT)
    ];
  }
}

export default new VideoValidation();
