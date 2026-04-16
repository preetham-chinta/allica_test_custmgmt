import { useNavigate }     from "react-router-dom";
import AppBar              from "@mui/material/AppBar";
import Toolbar             from "@mui/material/Toolbar";
import Typography          from "@mui/material/Typography";
import Box                 from "@mui/material/Box";
import ToggleButton        from "@mui/material/ToggleButton";
import ToggleButtonGroup   from "@mui/material/ToggleButtonGroup";
import Divider             from "@mui/material/Divider";
import Tooltip             from "@mui/material/Tooltip";
import IconButton          from "@mui/material/IconButton";
import Avatar              from "@mui/material/Avatar";
import Menu                from "@mui/material/Menu";
import MenuItem            from "@mui/material/MenuItem";
import ListItemIcon        from "@mui/material/ListItemIcon";
import ListItemText        from "@mui/material/ListItemText";
import AccountBalanceIcon  from "@mui/icons-material/AccountBalance";
import LogoutIcon          from "@mui/icons-material/Logout";
import PersonIcon          from "@mui/icons-material/Person";
import { useState }        from "react";
import { useBackendStore, useAuthStore } from "@/store";

function BackendToggle() {
  const { backend, version, setBackend, setVersion } = useBackendStore();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="overline" color="text.disabled" sx={{ lineHeight: 1 }}>
          Backend
        </Typography>
        <ToggleButtonGroup
          value={backend} exclusive size="small"
          onChange={(_, val) => val && setBackend(val)}
          aria-label="Select backend"
        >
          <Tooltip title="Spring MVC — blocking, Tomcat, JPA, Hibernate Search">
            <ToggleButton value="mvc" aria-label="MVC :8080">MVC :8080</ToggleButton>
          </Tooltip>
          <Tooltip title="Spring WebFlux — reactive, Netty, R2DBC">
            <ToggleButton value="webflux" aria-label="WebFlux :8081">WebFlux :8081</ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Box>

      <Divider orientation="vertical" flexItem />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="overline" color="text.disabled" sx={{ lineHeight: 1 }}>
          API
        </Typography>
        <ToggleButtonGroup
          value={version} exclusive size="small"
          onChange={(_, val) => val && setVersion(val)}
          aria-label="Select API version"
        >
          <Tooltip title="V1 — id, firstName, lastName, dateOfBirth, createdAt">
            <ToggleButton value="v1">v1</ToggleButton>
          </Tooltip>
          <Tooltip title="V2 — adds fullName, email, status, updatedAt">
            <ToggleButton value="v2">v2</ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}

function UserMenu() {
  const { logout }    = useAuthStore();
  const navigate      = useNavigate();
  const [anchor, setAnchor] = useState(null);

  const handleLogout = () => {
    setAnchor(null);
    logout();                      // clears token from Zustand + sessionStorage
    navigate("/login", { replace: true });
  };

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label="Open user menu"
          size="small"
          sx={{ ml: 1 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.875rem" }}>
            <PersonIcon sx={{ fontSize: 18 }} />
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ sx: { minWidth: 180, mt: 0.5 } }}
      >
        <MenuItem disabled sx={{ opacity: "1 !important" }}>
          <ListItemText
            primary="Dev user"
            secondary="dev@allicatest.com"
            primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
            secondaryTypographyProps={{ variant: "caption" }}
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Sign out" primaryTypographyProps={{ variant: "body2" }} />
        </MenuItem>
      </Menu>
    </>
  );
}

export function AppHeader() {
  return (
    <AppBar position="sticky" role="banner">
      <Toolbar sx={{ gap: 3, minHeight: { xs: 60 } }}>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AccountBalanceIcon sx={{ color: "primary.main", fontSize: 22 }} />
          <Typography variant="h6" component="span"
                      sx={{ fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>
            Allica Test
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <BackendToggle />

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <UserMenu />
      </Toolbar>
    </AppBar>
  );
}
