import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
// import { checkAuthHandler } from '../features/auth/authSlice';
import { Box } from '@mui/material';

import './app.module.scss';

import {
  EmailConfirm,
  History,
  Library,
  Likes,
  LoginForm,
  MainPage,
  NotFound,
  SearchFeed,
  SignupForm,
  Subscriptions,
  VideoCard,
  UserProfile,
  VideoGrid,
  PlayListGrid,
  ChannelGrid,
} from '../components';
import VideoDetail from '../components/VideoDetail/VideoDetail';
import EditItemInfo from '../components/edit-item-info/edit-item-info';
import EditItemController from '../controllers/EditItemController';
import { CHANNEL, PLAYLIST, VIDEO } from '@constants/frontend';
import UploadVideoDraft from '../components/UploadVideo/UploadVideoDraft';
import UserPage from '../components/UserPage/UserPage';
import AuthController from '../controllers/AuthController';
import {
  setAccessToken,
  setAuthStatus,
  setId,
  setNickName,
  setRole,
} from '../store/slice';
import GetChildrenController from '../controllers/GetChildrenController';
import VideoController from '../controllers/VideoController';

export function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const refreshAuth = async () => {
      if (localStorage.getItem('token')) {
        const { isBaned, accessToken, id, nickName, role } =
          await AuthController.checkAuth();
        if (isBaned) {
          localStorage.removeItem('token');
          console.log(isBaned, 'user banned');
          dispatch(setAuthStatus(false));
          dispatch(setAccessToken(''));
          dispatch(setId('0'));
          dispatch(setNickName(''));
          dispatch(setRole(''));
          return;
        }
        localStorage.setItem('token', accessToken);
        dispatch(setAuthStatus(true));
        dispatch(setAccessToken(accessToken));
        dispatch(setId(String(id)));
        dispatch(setNickName(nickName));
        dispatch(setRole(role));
      }
    };
    refreshAuth()
      .then(() => {
        console.log('User update successful');
      })
      .catch((err) => {
        console.log('User update failed');
        console.log(err);
      });
  }, []);
  return (
    <Box sx={{ bgcolor: 'darkBackground.main' }}>
      <Routes>
        <Route path="/" exact element={<MainPage />} />
        <Route path="/search/:searchTerm" element={<SearchFeed />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/userProfile/:user_id" element={<UserProfile />} />
        <Route path={`/${CHANNEL}/:idList`} element={<UserPage />} />
        <Route path="/video/:videoId" element={<VideoCard />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/likes" element={<Likes />} />
        <Route path="/library" element={<Library />} />
        <Route path="/history" element={<History />} />
        <Route
          path={`/${CHANNEL}/get_all/:authorId`}
          element={<ChannelGrid />}
        />
        <Route
          path={`/${PLAYLIST}/get_all/:idList`}
          element={<PlayListGrid isParent={true} />}
        />
        <Route
          path={`/${VIDEO}/get_all/:idList`}
          element={
            <VideoGrid
              withHeader
              isParent={true}
              getChildren={GetChildrenController.getAllItemsById}
            />
          }
        />
        <Route path={`/${CHANNEL}/get_one/:id`} element={<ChannelGrid />} />
        <Route
          path={`/${PLAYLIST}/get_one/:id`}
          element={<PlayListGrid isParent={true} />}
        />
        <Route path={`/${VIDEO}/get_one/:idList`} element={<VideoDetail />} />
        <Route
          path={`/${CHANNEL}/create/:idList`}
          element={
            <EditItemInfo
              elemType={CHANNEL}
              sendData={EditItemController.addItem}
            />
          }
        />
        <Route
          path={`/${CHANNEL}/edit/:idList`}
          element={
            <EditItemInfo
              elemType={CHANNEL}
              sendData={EditItemController.updateItem}
              isEdit={true}
              getItemById={GetChildrenController.getItemById}
            />
          }
        />
        <Route
          path={`/${PLAYLIST}/create/:idList`}
          element={
            <EditItemInfo
              elemType={PLAYLIST}
              sendData={EditItemController.addItem}
            />
          }
        />
        <Route
          path={`/${PLAYLIST}/edit/:idList`}
          element={
            <EditItemInfo
              elemType={PLAYLIST}
              sendData={EditItemController.updateItem}
              isEdit={true}
              getItemById={GetChildrenController.getItemById}
            />
          }
        />
        <Route
          path={`/${VIDEO}/create/:idList`}
          element={<UploadVideoDraft />}
        />
        <Route
          path={`/${VIDEO}/edit/:idList`}
          element={
            <EditItemInfo
              elemType={VIDEO}
              sendData={VideoController.editVideo}
              isEdit={true}
              getItemById={VideoController.getVideoInfo}
            />
          }
        />
        <Route path="/404NotFound" element={<NotFound />} />
        <Route path="/emailConfirm" element={<EmailConfirm />} />
        <Route path="/videoDetail" element={<VideoDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Box>
  );
}
export default App;
