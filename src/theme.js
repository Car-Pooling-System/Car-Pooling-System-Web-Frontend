// theme.js
// Ride Pooling Platform Design System
// Light + Dark Mode + Motion System

const base = {

  /* ==========================
      TYPOGRAPHY
  ========================== */

  typography: {

    fontFamily: {
      primary:
        "'Inter','Poppins',system-ui,-apple-system,BlinkMacSystemFont,sans-serif",

      heading:
        "'Poppins','Inter',sans-serif",

      mono:
        "'JetBrains Mono',monospace"
    },

    fontWeight: {

      light:300,
      regular:400,
      medium:500,
      semiBold:600,
      bold:700
    },

    fontSize:{

      xs:"12px",
      sm:"14px",
      base:"16px",
      md:"18px",

      lg:"20px",

      h6:"22px",
      h5:"26px",
      h4:"30px",
      h3:"36px",
      h2:"44px",
      h1:"52px"
    },

    lineHeight:{

      tight:1.2,
      normal:1.5,
      relaxed:1.7
    }
  },



  /* ==========================
      SPACING
  ========================== */

  spacing:{

    xs:"4px",
    sm:"8px",
    md:"16px",
    lg:"24px",
    xl:"32px",
    xxl:"48px",
    xxxl:"64px"
  },



  /* ==========================
      BORDER RADIUS
  ========================== */

  radius:{

    sm:"6px",
    md:"12px",
    lg:"18px",
    xl:"24px",

    pill:"999px"
  },



  /* ==========================
      SHADOWS
  ========================== */

  shadows:{

    soft:
      "0 4px 12px rgba(0,0,0,.06)",

    medium:
      "0 10px 28px rgba(0,0,0,.09)",

    floating:
      "0 20px 60px rgba(0,0,0,.12)"
  },



  /* ==========================
      BREAKPOINTS
  ========================== */

  breakpoints:{

    mobile:"480px",
    tablet:"768px",
    laptop:"1024px",
    desktop:"1280px",
    wide:"1536px"
  },



  /* ==========================
      MOTION SYSTEM
  ========================== */

  motion:{

    duration:{

      fastest:"120ms",
      fast:"180ms",

      normal:"250ms",

      slow:"400ms",

      slowest:"600ms"
    },


    easing:{

      // Natural UI Movement
      standard:"cubic-bezier(0.4,0,0.2,1)",

      // Buttons hover
      accelerate:"cubic-bezier(0.4,0,1,1)",

      // Modals + cards
      decelerate:"cubic-bezier(0,0,0.2,1)",

      // Springy Uber style
      bounce:"cubic-bezier(.34,1.56,.64,1)",

      // Hero animations
      smooth:"cubic-bezier(0.25,0.8,0.25,1)"
    }
  }

};



/* ===============================
    LIGHT MODE
================================ */

const light = {

  mode:"light",

  colors:{

    primary:"#A7E92F",
    primaryDark:"#7BC01F",
    primaryLight:"#E8FFB8",

    secondary:"#111827",

    accent:"#00BFA6",

    background:"#F7F9F4",

    surface:"#FFFFFF",

    border:"#E5E7EB",

    text:{

      primary:"#111827",
      secondary:"#6B7280",
      muted:"#9CA3AF",
      inverse:"#FFFFFF"
    },

    status:{

      success:"#16A34A",
      warning:"#F59E0B",
      error:"#DC2626",
      info:"#0284C7"
    },

    gradients:{

      hero:
        "linear-gradient(135deg,#E8FFB8,#F7FFF1)",

      primaryCTA:
        "linear-gradient(135deg,#A7E92F,#7BC01F)"
    },

    map:{

      route:"#A7E92F",

      driver:"#111827",

      pickup:"#16A34A",

      drop:"#DC2626"
    }
  }
};



/* ===============================
    DARK MODE
================================ */

const dark = {

  mode:"dark",

  colors:{

    primary:"#B6FF3C",

    primaryDark:"#86D320",

    primaryLight:"#1C2C08",

    secondary:"#E5E7EB",

    accent:"#19E5CE",

    background:"#0B0F0A",

    surface:"#121812",

    border:"#2A2F2A",

    text:{

      primary:"#F9FAFB",

      secondary:"#9CA3AF",

      muted:"#6B7280",

      inverse:"#111827"
    },

    status:{

      success:"#22C55E",

      warning:"#FBBF24",

      error:"#EF4444",

      info:"#38BDF8"
    },

    gradients:{

      hero:
        "linear-gradient(135deg,#121812,#0B0F0A)",

      primaryCTA:
        "linear-gradient(135deg,#B6FF3C,#86D320)"
    },

    map:{

      route:"#B6FF3C",

      driver:"#FFFFFF",

      pickup:"#22C55E",

      drop:"#EF4444"
    }
  }
};



/* ===============================
    COMPONENT TOKENS
================================ */

const components = {

  navbar:{

    height:"72px",

    blur:"blur(14px)",

    backdrop:"rgba(255,255,255,.7)"
  },


  button:{

    radius:"999px",

    padding:"12px 22px",

    fontWeight:600,

    shadowHover:
      "0 8px 20px rgba(0,0,0,.15)"
  },


  card:{

    radius:"18px",

    padding:"24px",

    hoverLift:"translateY(-4px)"
  },


  input:{

    radius:"12px",

    padding:"12px",

    focusScale:"scale(1.01)"
  }
};



/* ===============================
   CSS VARIABLE EXPORT HELPER
================================ */

export const createCSSVariables = (theme)=>{

  const vars = {};

  Object.entries(theme.colors).forEach(([key,val])=>{

    if(typeof val === "object"){

      Object.entries(val).forEach(([k,v])=>{

        vars[`--color-${key}-${k}`]=v;

      });

    }else{

      vars[`--color-${key}`]=val;
    }
  });

  return vars;
};



/* ===============================
    FINAL EXPORT
================================ */

const theme = {

  base,

  light,

  dark,

  components
};

export default theme;