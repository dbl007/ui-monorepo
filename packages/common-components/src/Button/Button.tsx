import React, { ReactNode } from "react"
import clsx from "clsx"
import { ITheme, makeStyles, createStyles } from "@imploy/common-themes"

const useStyles = makeStyles((theme: ITheme) =>
  createStyles({
    // JSS in CSS goes here
    root: {
      ...theme.typography.button,
      borderRadius: `${theme.constants.generalUnit / 4}px`,
      display: "flex",
      justifyContent: "center",
      textAlign: "center",
      alignItems: "center",
      textDecoration: "none",
      cursor: "pointer",
      transitionDuration: `${theme.animation.transform}ms`,
      border: "none",
      outline: "none",
      "& svg": {
        transitionDuration: `${theme.animation.transform}ms`,
        margin: `${0}px ${theme.constants.generalUnit / 2}px 0`,
      },
      "&.large": {
        padding: `${theme.constants.generalUnit}px ${
          theme.constants.generalUnit * 2
        }px`,
      },
      "&.medium": {
        padding: `${theme.constants.generalUnit * 0.6}px ${
          theme.constants.generalUnit * 2
        }px`,
      },
      "&.small": {
        padding: `${theme.constants.generalUnit * 0.125}px ${
          theme.constants.generalUnit
        }px`,
      },
    },
    // Variants
    primary: {
      backgroundColor: theme.palette.additional["blue"][6],
      color: theme.palette.common.white.main,
      "& svg": {
        fill: theme.palette.common.white.main,
      },
      "&:hover": {
        backgroundColor: theme.palette.additional["blue"][5],
      },
      "&:focus": {
        backgroundColor: theme.palette.additional["blue"][5],
      },
      "&:active": {
        backgroundColor: theme.palette.additional["blue"][7],
      },
    },
    outline: {
      color: theme.palette.additional["gray"][8],
      backgroundColor: theme.palette.common?.white.main,
      border: `1px solid ${theme.palette.additional["gray"][5]}`,
      "& svg": {
        fill: theme.palette.additional["gray"][8],
      },
      "&:hover": {
        borderColor: theme.palette.additional["blue"][5],
        color: theme.palette.additional["blue"][5],
        "& svg": {
          fill: theme.palette.additional["blue"][5],
        },
      },
      "&:focus": {
        borderColor: theme.palette.additional["blue"][5],
        color: theme.palette.additional["blue"][5],
        "& svg": {
          fill: theme.palette.additional["blue"][5],
        },
      },
      "&:active": {
        borderColor: theme.palette.additional["blue"][7],
        color: theme.palette.additional["blue"][7],
        "& svg": {
          fill: theme.palette.additional["blue"][7],
        },
      },
    },
    dashed: {
      color: theme.palette.additional["gray"][8],
      backgroundColor: theme.palette.common?.white.main,
      border: `1px dashed ${theme.palette.additional["gray"][5]}`,
      "& svg": {
        fill: theme.palette.additional["gray"][8],
      },
      "&:hover": {
        borderColor: theme.palette.additional["blue"][5],
        color: theme.palette.additional["blue"][5],
        "& svg": {
          fill: theme.palette.additional["blue"][5],
        },
      },
      "&:focus": {
        borderColor: theme.palette.additional["blue"][5],
        color: theme.palette.additional["blue"][5],
        "& svg": {
          fill: theme.palette.additional["blue"][5],
        },
      },
      "&:active": {
        borderColor: theme.palette.additional["blue"][7],
        color: theme.palette.additional["blue"][7],
        "& svg": {
          fill: theme.palette.additional["blue"][7],
        },
      },
    },
    danger: {
      color: theme.palette.common?.white.main,
      backgroundColor: theme.palette.additional["red"][5],
      border: `1px solid transparent`,
      "& svg": {
        fill: theme.palette.common?.white.main,
      },
      "&:hover": {
        backgroundColor: theme.palette.additional["red"][4],
      },
      "&:focus": {
        backgroundColor: theme.palette.additional["red"][4],
      },
      "&:active": {
        backgroundColor: theme.palette.additional["red"][7],
      },
    },
    // Modifiers
    fullsize: {
      width: "100%",
    },
    icon: {
      borderRadius: "50%",
      padding: 0,
      position: "relative",
      "& > *": {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      },
      "& svg": {
        margin: 0,
      },
      "&.large": {
        height: theme.constants.generalUnit * 5,
        width: theme.constants.generalUnit * 5,
        "& svg": {
          height: 20,
          width: 20,
        },
      },
      "&.medium": {
        height: theme.constants.generalUnit * 4,
        width: theme.constants.generalUnit * 4,
        "& svg": {
          height: 18,
          width: 18,
        },
      },
      "&.small": {
        height: theme.constants.generalUnit * 3,
        width: theme.constants.generalUnit * 3,
        "& svg": {
          height: 16,
          width: 16,
        },
      },
    },
    disabled: {
      backgroundColor: `${theme.palette.additional["gray"][3]} !important`,
      borderColor: `${theme.palette.additional["gray"][5]} !important`,
      color: `${theme.palette.additional["gray"][6]} !important`,
      cursor: "initial",
      "& svg": {
        fill: `${theme.palette.additional["gray"][6]} !important`,
      },
      "&:hover": {
        backgroundColor: theme.palette.additional["gray"][3],
        borderColor: theme.palette.additional["gray"][5],
        color: theme.palette.additional["gray"][6],
        "& svg": {
          fill: `${theme.palette.additional["gray"][6]} !important`,
        },
      },
    },
  }),
)

type ReactButton = React.HTMLProps<HTMLButtonElement>

interface IButtonProps extends Omit<ReactButton, "size"> {
  className?: string
  children?: ReactNode | ReactNode[]
  fullsize?: boolean
  variant?: "primary" | "outline" | "dashed" | "danger"
  iconButton?: boolean
  size?: "large" | "medium" | "small"
  type?: "button" | "submit" | "reset"
}

const Button: React.FC<IButtonProps> = ({
  children,
  fullsize,
  iconButton,
  className,
  variant = "primary",
  disabled = false,
  size = "medium",
  ...rest
}: IButtonProps) => {
  const classes = useStyles()

  return (
    <button
      className={clsx(
        classes.root,
        className,
        classes[variant],
        fullsize && classes.fullsize,
        disabled && classes.disabled,
        iconButton && classes.icon,
        `${size}`,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button

export { IButtonProps }
