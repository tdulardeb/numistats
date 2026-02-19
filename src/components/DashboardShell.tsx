'use client';

import { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PeopleIcon from '@mui/icons-material/People';
import ChatIcon from '@mui/icons-material/Chat';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import BarChartIcon from '@mui/icons-material/BarChart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import { useThemeMode } from '@/context/ThemeContext';
import { useNavigation, NavigationSection } from '@/context/NavigationContext';
import { useAuth } from '@/context/AuthContext';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

interface NavItem {
  text: string;
  icon: ReactNode;
  section: NavigationSection;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, section: 'all' },
  { text: 'Atenciones', icon: <SupportAgentIcon />, section: 'atenciones' },
  { text: 'Analytics', icon: <BarChartIcon />, section: 'analytics' },
  { text: 'PROD vs PREPROD', icon: <CompareArrowsIcon />, section: 'compare' },
  { text: 'Usuarios', icon: <PeopleIcon />, section: 'users' },
  { text: 'Mensajes', icon: <ChatIcon />, section: 'messages' },
  { text: 'Tickets', icon: <ConfirmationNumberIcon />, section: 'tickets' },
];

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const theme = useTheme();
  const router = useRouter();
  const { mode, toggleTheme } = useThemeMode();
  const { activeSection, setActiveSection, sectionTitle } = useNavigation();
  const { user, signOut } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  // Obtener iniciales del email del usuario
  const userInitials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : 'US';
  const userEmail = user?.email || 'Usuario';

  const currentDrawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleNavClick = (section: NavigationSection) => {
    setActiveSection(section);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo / Brand */}
      <Box
        sx={{
          p: collapsed ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TrendingUpIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        {!collapsed && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            NumiStats
          </Typography>
        )}
      </Box>

      {/* Navigation */}
      <List sx={{ px: 1, flex: 1 }}>
        {navItems.map((item) => {
          const isSelected = activeSection === item.section;
          const button = (
            <ListItemButton
              selected={isSelected}
              onClick={() => handleNavClick(item.section)}
              sx={{
                py: 1.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1.5 : 2,
                borderRadius: 1,
                mb: 0.5,
                '& .MuiListItemIcon-root': {
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  minWidth: collapsed ? 0 : 40,
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'text.primary' : 'text.secondary',
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.text} disablePadding>
              {collapsed ? (
                <Tooltip title={item.text} placement="right" arrow>
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </ListItem>
          );
        })}
      </List>

      {/* Collapse button */}
      <Box
        sx={{
          p: 1,
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
        }}
      >
        <Tooltip title={collapsed ? 'Expandir menú' : 'Minimizar menú'} placement="right" arrow>
          <IconButton
            onClick={handleCollapseToggle}
            sx={{
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* User section at bottom */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1.5,
        }}
      >
        {collapsed ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tooltip title={userEmail} placement="right" arrow>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
              >
                {userInitials}
              </Avatar>
            </Tooltip>
            <Tooltip title="Cerrar sesión" placement="right" arrow>
              <IconButton
                onClick={handleSignOut}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                fontSize: '0.875rem',
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {userEmail}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Administrador
              </Typography>
            </Box>
            <Tooltip title="Cerrar sesión">
              <IconButton
                onClick={handleSignOut}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          bgcolor: 'background.paper',
          transition: theme.transitions.create(['width', 'margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {sectionTitle}
          </Typography>

          {/* Theme Toggle Button */}
          <Tooltip title={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              sx={{
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'rotate(180deg)',
                },
              }}
            >
              {mode === 'dark' ? (
                <LightModeIcon sx={{ color: '#fbbf24' }} />
              ) : (
                <DarkModeIcon sx={{ color: '#8b5cf6' }} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title={userEmail}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                display: { xs: 'none', sm: 'flex' },
                ml: 1,
              }}
            >
              {userInitials}
            </Avatar>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Drawer - Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer - Desktop (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: currentDrawerWidth,
          flexShrink: 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentDrawerWidth,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          minHeight: '100vh',
          bgcolor: 'background.default',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
