"use client"

import { motion } from "framer-motion"

export const FadeIn = ({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
)

export const CountUp = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {value}{suffix}
      </motion.span>
    </motion.span>
  )
}

export const SlideIn = ({
  children,
  direction = "up",
  delay = 0,
  className,
}: {
  children: React.ReactNode
  direction?: "up" | "left" | "right"
  delay?: number
  className?: string
}) => {
  const initial =
    direction === "up" ? { opacity: 0, y: 20 } :
    direction === "left" ? { opacity: 0, x: -20 } :
    { opacity: 0, x: 20 }

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
