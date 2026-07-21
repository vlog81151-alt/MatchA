"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export function AnimatedSection({
  children,
  className,
  ...props
}: HTMLMotionProps<"section"> & {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-80px" }}
      whileInView={{ opacity: 1, y: 0 }}
      {...props}
    >
      {children}
    </motion.section>
  );
}
