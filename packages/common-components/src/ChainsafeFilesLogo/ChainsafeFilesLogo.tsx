import React from "react"
import { makeStyles, createStyles, ITheme } from "@chainsafe/common-theme"
import clsx from "clsx"

const useStyles = makeStyles(({ overrides }: ITheme) =>
  createStyles({
    root: {
      width: "fit-content",
      ...overrides?.ChainsafeLogo?.root
    }
  })
)

const ChainsafeFilesLogo: React.FC<{ className?: string }> = ({
  className
}) => {
  const classes = useStyles()
  return (
    <img
      src="ChainSafe-logo.png"
      alt="Chainsafe Logo"
      className={clsx(classes.root, className)}
    />
  )
}

export default ChainsafeFilesLogo
