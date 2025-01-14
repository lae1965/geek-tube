import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

const ConfirmModal = ({
  openModal,
  closeModal,
  title,
  content,
  cancelButton,
  submitButton,
  submitAction,
}) => {
  return (
    <Dialog
      open={openModal}
      onClose={closeModal}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      sx={{ userSelect: 'none' }}
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          color="darkBackground.contrastText"
        >
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={closeModal}
          variant="contained"
          color="baseBlue"
          autoFocus
        >
          {cancelButton}
        </Button>
        <Button onClick={submitAction} variant="outlined" color="whiteButton">
          {submitButton}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmModal;
