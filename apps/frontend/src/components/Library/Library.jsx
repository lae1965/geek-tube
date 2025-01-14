import React from 'react';
import { Box, Typography } from '@mui/material';

import { Header } from '../';

const Library = (props) => {
  const selectedCategory = 'Моя библиотека';

  return (
    <Box sx={{ display: 'flex', pt: 8 }}>
      <Header selectedCategory={selectedCategory} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'darkBackground.main',
          p: 2,
          maxHeight: '93vh',
          flex: 2,
        }}
      >
        <Typography>Library</Typography>
      </Box>
    </Box>
  );
};

export default Library;
