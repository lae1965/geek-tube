import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import React, { useState } from 'react';
import UserController from '../../controllers/UsersController';
import { useDispatch } from 'react-redux';
import { setNickName } from '../../store/slice';

import styles from './Personal.module.scss';

const Personal = (props) => {
  const {
    userId,
    currentFirstName,
    currentLastName,
    currentNickName,
    currentBirthDate,
    refreshData,
  } = props;
  const dispatch = useDispatch();
  const [handleStatusOk, setHandleStatusOk] = useState(false);
  const schema = yup.object({
    nickName: yup
      .string()
      .trim()
      .min(2, 'Псевдоним должен быть длиннее 2 символа')
      .required('Поле Имя обязательно к заполнению'),
    firstName: yup
      .string()
      .trim()
      .min(2, 'Имя должно быть длиннее 2 символа')
      .required('Поле Имя обязательно к заполнению'),
    lastName: yup
      .string()
      .trim()
      .min(2, 'Фамилия должна быть длиннее 2 символа')
      .required('Поле Фамилия обязательно'),
    birthDate: yup
      .date()
      .max(
        new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000),
        'Не моложе 8 лет'
      )
      .required('Поле Дата рождения обязательно'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      firstName: currentFirstName,
      lastName: currentLastName,
      nickName: currentNickName,
      birthDate: currentBirthDate,
    },
    resolver: yupResolver(schema),
  });

  const onSubmit = async ({ nickName, firstName, lastName, birthDate }) => {
    try {
      const dto = {};
      if (nickName !== currentNickName) {
        dto.nickName = nickName;
      }
      if (firstName !== currentFirstName) {
        dto.firstName = firstName;
      }
      if (lastName !== currentLastName) {
        dto.lastName = lastName;
      }
      if (
        new Date(birthDate).toLocaleString() !==
        new Date(currentNickName).toLocaleString()
      ) {
        dto.birthDate = birthDate;
      }
      await UserController.updateUser(userId, dto);
      dispatch(setNickName(nickName));
      setHandleStatusOk(true);
      refreshData();
    } catch (err) {
      setHandleStatusOk(false);
      console.log('Update user data failed');
      console.log(err);
    }
  };

  const handleReset = () => {
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ width: '650px' }}>
      {handleStatusOk ? (
        <Typography
          variant="h6"
          textAlign="center"
          mb={2}
          sx={{ userSelect: 'none' }}
        >
          Успешно изменено
        </Typography>
      ) : (
        ''
      )}
      <Typography
        variant="body1"
        textAlign="center"
        mb={2}
        sx={{ userSelect: 'none', opacity: 0.6 }}
      >
        Чтобы сохранить изменения, пожалуйста, заполните все поля
      </Typography>
      <Stack
        justifyContent="space-between"
        flexDirection="row"
        alignItems="center"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
          <Box className={styles.profileInputBox}>
            <input
              {...register('nickName')}
              placeholder="Псевдоним"
              className={styles.profileInput}
            />
          </Box>
          {errors?.nickName && (
            <p className={styles.error}>
              {errors?.nickName?.message || 'Err!!!!!'}
            </p>
          )}

          <Box className={styles.profileInputBox}>
            <input
              {...register('firstName')}
              placeholder="Имя"
              className={styles.profileInput}
            />
          </Box>
          {errors?.firstName && (
            <p className={styles.error}>
              {errors?.firstName?.message || 'Err!!!!!'}
            </p>
          )}

          <Box className={styles.profileInputBox}>
            <input
              {...register('lastName')}
              placeholder="Фамилия"
              className={styles.profileInput}
            />
          </Box>
          {errors?.lastName && (
            <p className={styles.error}>
              {errors?.lastName?.message || 'Err!!!!!'}
            </p>
          )}

          <Box className={styles.profileInputBox}>
            <input
              {...register('birthDate')}
              placeholder="Дата рождения"
              type="date"
              className={styles.sprofilenput}
            />
          </Box>
          {errors?.birthDate && (
            <p className={styles.error}>
              {errors?.birthDate?.message || 'Err!!!!!'}
            </p>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Button
            type="submit"
            disabled={!(isValid && isDirty)}
            variant="contained"
            color="baseBlue"
          >
            Сохранить данные
          </Button>
          <Button
            type="button"
            disabled={!isDirty}
            variant="outlined"
            onClick={handleReset}
            color="whiteButton"
          >
            Отменить изменения
          </Button>
        </Box>
      </Stack>
    </form>
  );
};

export default Personal;
