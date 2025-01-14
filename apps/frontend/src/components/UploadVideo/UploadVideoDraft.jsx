import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

import VideoController from '../../controllers/VideoController';
import Header from '../Header/Header';
import Thumbnail from './Thumbnail';
import { uploadVideoLogo, VIDEO } from '@constants/frontend';
import useVideoThumbnailsForm from '@gbtube/thumbGenerator';

import styles from './UploadVideo.module.scss';

const UploadVideoDraft = () => {
  const {
    handleGenerateThumbnails,
    handleInputFileChange,
    isError,
    selectedThumbnail,
    setSelectedThumbnail,
    thumbnails,
  } = useVideoThumbnailsForm();

  const { idList } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExistErr, setIsExistErr] = useState(false);
  const navigate = useNavigate();
  const refDuration = useRef('');

  const calcDuration = (evt) => {
    const file = evt.target.files[0];

    if (!file) return;

    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      let duration = video.duration.toFixed(1);
      let hour = Math.trunc(duration / (60 * 60));
      duration = hour > 0 ? duration - hour * 60 * 60 : duration;
      hour = hour === 0 ? '00' : hour;
      hour = typeof hour === 'number' && hour < 10 ? `0${hour}` : hour;
      let min = Math.trunc(duration / 60);
      min = min === 0 ? '00' : min;
      min = typeof min === 'number' && min < 10 ? `0${min}` : min;
      let sec = Math.trunc(duration % 60);
      sec = sec < 10 ? `0${sec}` : sec;
      refDuration.current = `${hour} : ${min} : ${sec}`;
      console.log(refDuration.current);
    };
    video.src = URL.createObjectURL(file);
  };

  useEffect(() => {
    document.title = 'GeekTube | Загрузка видео';
  }, []);

  const ref = useRef('');
  useEffect(() => {
    ref.current = selectedThumbnail;
  });

  const handleChangeFile = (evt) => {
    setSelectedFile(evt.target.files[0]);
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();

    if (evt.target.title.value === '' || !selectedFile || !selectedThumbnail) {
      setUploadErrorMsg(
        'Файл, название или обложка не указаны. Будьте внимательны!'
      );
      return;
    } else {
      setUploadErrorMsg('');
    }

    const formData = new FormData(evt.target);
    formData.append('idList', idList);
    formData.append('thumbnail', ref.current);
    formData.append('duration', refDuration.current);

    try {
      setIsLoading(true);
      await VideoController.addVideo(formData);
      evt.target.reset();
      setIsLoading(false);
      setIsExistErr(false);
      navigate(`/${VIDEO}/get_all/${idList}`, { replace: true });
    } catch(err) {
      setIsLoading(false);
      if (err.message.includes('409')) {
        setIsExistErr(true);
      } else {
        setUploadErrorMsg('Произошла ошибка при загрузке. Повторите попытку!');
      }
      console.log(err);
    }
  };

  return (
    <>
      <Header />
      <Stack className={styles.uploadWrapper}>
        <Paper
          elevation={3}
          className={`${styles.uploadPaper} ${
            isLoading === true ? styles.uploadLoader : ''
          }`}
        >
          {isLoading === true ? (
            <>
              <Box className={styles.loaderTitle}>
                <CloudUploadIcon color="baseBlue" sx={{ fontSize: '9rem' }} />
                <Typography variant="h5">
                  Пожалуйста подождите, пока ваше видео телепортируется к нам
                </Typography>
              </Box>

              <CircularProgress />
            </>
          ) : (
            <>
              <Typography variant="h5" className={styles.uploadTitle}>
                Давайте загрузим ваше видео
              </Typography>

              <Box className={styles.uploadLogo}>
                <img src={uploadVideoLogo} alt="Upload Logo" />
              </Box>

              <Box className={styles.uploadVideoBox}>
                <form onSubmit={handleSubmit} className={styles.uploadForm}>
                  <Box className={styles.uploadBtnBox}>
                    <Button
                      variant="contained"
                      color="baseBlue"
                      component="label"
                      disabled={isLoading}
                    >
                      <VideoCallIcon sx={{ mr: 1 }} />
                      Выбрать файл
                      <input
                        name="videoName"
                        onChange={(e) => {
                          handleChangeFile(e);
                          handleInputFileChange(e);
                          calcDuration(e);
                        }}
                        type="file"
                        hidden
                        accept="video/*,.3gp,.flv,.m4v,.mkv,.mov,.mp4,.mpeg,.mpg,.webm"
                      />
                    </Button>
                    <Button
                      variant="contained"
                      color="baseBlue"
                      component="label"
                      disabled={!selectedFile}
                      onClick={handleGenerateThumbnails}
                    >
                      <AddPhotoAlternateIcon sx={{ mr: 1 }} />
                      Создать обложку
                    </Button>
                  </Box>

                  <Typography className={styles.uploadVideoWarning}>
                    Допускаются файлы формата: <br /> 3gp, .avi, .flv, .m4v,
                    .mkv, .mov, .mp4, .mpeg, .mpg, .wmv, .webm
                  </Typography>
                  {isExistErr ? (
                    <p className={styles.errorText}>Это название уже занято.</p>
                  ) : (
                    ''
                  )}
                  <Typography className={styles.selectedFileText}>
                    {selectedFile ? `Выбранный файл: ${selectedFile.name}` : ''}
                  </Typography>

                  <Thumbnail
                    thumbnails={thumbnails}
                    selectedThumbnail={selectedThumbnail}
                    setSelectedThumbnail={setSelectedThumbnail}
                    isError={isError}
                  />

                  <Box className={styles.inputBox}>
                    <input
                      name="title"
                      type="text"
                      placeholder="Название ролика"
                      className={styles.uploadInput}
                    />
                  </Box>

                  <Box className={styles.inputBox}>
                    <textarea
                      name="description"
                      rows="3"
                      placeholder="Описание (по желанию)"
                      className={`${styles.uploadInput} ${styles.uploadTextarea}`}
                    />
                  </Box>

                  <Box className={styles.inputBox}>
                    <input
                      name="category"
                      type="text"
                      placeholder="Категория"
                      className={styles.uploadInput}
                    />
                  </Box>

                  <Typography className={styles.errorText}>
                    {uploadErrorMsg}
                  </Typography>

                  <Button
                    type="submit"
                    variant="contained"
                    color="baseBlue"
                    disabled={isLoading}
                  >
                    <CloudUploadIcon sx={{ mr: 1 }} />
                    Отправить
                  </Button>
                </form>
              </Box>
            </>
          )}
        </Paper>
      </Stack>
      <Box className={styles.copyright}>
        <Typography sx={{ color: '#999', textAlign: 'center' }}>
          &copy; {new Date().getFullYear()} GeekTube Team. Все права защищены
        </Typography>
      </Box>
    </>
  );
};

export default UploadVideoDraft;
