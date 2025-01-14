import React, { useMemo, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import styles from './VideoCommentary.module.scss';
import { Link } from 'react-router-dom';
import ShowMoreText from 'react-show-more-text';
import { getAuthStatus, getUserId } from '../../store/selectors';
import { shallowEqual, useSelector } from 'react-redux';
import {
  ThumbDown,
  ThumbDownOutlined,
  ThumbUp,
  ThumbUpOutlined,
} from '@mui/icons-material';
import AnswerController from '../../controllers/AnswerController';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { API_URL } from '@constants/frontend';

const CommentAnswers = ({
  answerData,
  currentUserId,
  videoOwnerId,
  answerId,
  handleDelete,
}) => {
  const [date, _] = useState(new Date(answerData?.createdTimestamp));
  const userId = useSelector(getUserId, shallowEqual);
  const theme = useTheme();
  const [dislikesCount, setDislikesCount] = useState(answerData?.dislikesCount);
  const [likesCount, setLikesCount] = useState(answerData?.likesCount);
  const [currentReaction, setCurrentReaction] = useState(answerData.grade);
  const currentAnswerId = useMemo(() => {
    return answerData.idList.split('_').at(-1);
  }, [answerData.idList]);
  const isAuth = useSelector(getAuthStatus, shallowEqual);

  const ReactionButton = styled(Button)(({ theme }) => ({
    borderRadius: '40px',
    transition: '.3s ease',
    '&:hover': {
      backgroundColor: theme.palette.shadows.main,
      color: theme.palette.coplimentPink.contrastText,
    },
  }));

  const isMayRemove = () => {
    return (
      currentUserId === String(answerData?.userId) ||
      currentUserId === videoOwnerId
    );
  };

  const handleLikeReaction = async () => {
    try {
      const { data: status } = await AnswerController.like(
        answerId || currentAnswerId,
        userId
      );

      if (status && currentReaction === '') {
        setLikesCount(likesCount + 1);
        setCurrentReaction('like');
      } else if (status && currentReaction === 'dislike') {
        setDislikesCount(dislikesCount - 1);
        setLikesCount(likesCount + 1);
        setCurrentReaction('like');
      } else {
        setLikesCount(likesCount - 1);
        setCurrentReaction('');
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDislikeReaction = async () => {
    try {
      const { data: status } = await AnswerController.dislike(
        answerId || currentAnswerId,
        userId
      );

      if (status && currentReaction === '') {
        setDislikesCount(dislikesCount + 1);
        setCurrentReaction('dislike');
      } else if (status && currentReaction === 'like') {
        setLikesCount(likesCount - 1);
        setDislikesCount(dislikesCount + 1);
        setCurrentReaction('dislike');
      } else {
        setDislikesCount(dislikesCount - 1);
        setCurrentReaction('');
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Stack direction="column" marginBottom={3}>
      <Box className={styles.comment} sx={{ marginLeft: '3.4rem' }}>
        <Box className={styles.avatar}>
          <Avatar alt="avatar" src={`${API_URL}/user/avatar/${answerData.userId}`} />
        </Box>
        <Box>
          <Stack direction="row" alignItems="center">
            <Typography variant="subtitle1">{answerData.nickName}</Typography>

            <Typography
              variant={'caption'}
              fontSize=".7rem"
              marginLeft="10px"
              sx={{ userSelect: 'none', opacity: 0.6 }}
            >
              Опубликовано: {date.toLocaleDateString()}
            </Typography>
          </Stack>
          <ShowMoreText
            className={styles.truncateText}
            lines={2}
            more="Читать далее"
            less="Свернуть"
            // anchorClass="show-more-less-clickable"
            expanded={false}
            keepNewLines={true}
            // width={800}
            truncatedEndingComponent={'... '}
          >
            {answerData.description}
          </ShowMoreText>

          <Box>
            <Tooltip title="Нравится">
              <ReactionButton onClick={handleLikeReaction} disabled={!isAuth}>
                {currentReaction === 'like' ? (
                  <ThumbUp
                    sx={{
                      color: theme.palette.coplimentPink.main,
                    }}
                  />
                ) : (
                  <ThumbUpOutlined
                    sx={{
                      color: theme.palette.whiteButton.main,
                    }}
                  />
                )}
                <Typography
                  variant={'body1'}
                  sx={{ opacity: 0.7 }}
                  marginLeft={2}
                >
                  {likesCount}{' '}
                </Typography>
              </ReactionButton>
            </Tooltip>
            <Tooltip title="Не нравится">
              <ReactionButton
                onClick={handleDislikeReaction}
                disabled={!isAuth}
              >
                {currentReaction === 'dislike' ? (
                  <ThumbDown
                    sx={{
                      color: theme.palette.coplimentPink.main,
                    }}
                  />
                ) : (
                  <ThumbDownOutlined
                    sx={{
                      color: theme.palette.whiteButton.main,
                    }}
                  />
                )}
                <Typography
                  variant="body1"
                  sx={{ opacity: 0.7 }}
                  marginLeft={2}
                >
                  {dislikesCount}{' '}
                </Typography>
              </ReactionButton>
            </Tooltip>
            {isMayRemove() && (
              <Button onClick={handleDelete} variant="text" color="baseBlue">
                Удалить
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Stack>
  );
};

export default CommentAnswers;
