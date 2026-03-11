'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Toolbar } from '@mui/material';
import Header from '../components/Header';
import Sidebar, { drawerWidth } from '../components/SideBar';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

import '../glogal.css';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === '/login';

  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <html lang="pt-BR">
      <body style={{ backgroundColor: '#f4f6f8' }}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />

            {/* ✅ LOGIN: sem Header/Sidebar */}
            {isLoginRoute ? (
              <Box sx={{ minHeight: '100vh' }}>{children}</Box>
            ) : (
              <Box sx={{ display: 'flex' }}>
                <Header onMenuOpen={handleDrawerToggle} />

                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Sidebar open={true} onClose={() => {}} variant="permanent" />
                </Box>

                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  <Sidebar
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    variant="temporary"
                  />
                </Box>

                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                  }}
                >
                  <Toolbar />
                  {children}
                </Box>
              </Box>
            )}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
