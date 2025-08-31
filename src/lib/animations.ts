// Animation utilities for smooth transitions
export const pageTransitions = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: "easeInOut" }
}

export const slideTransitions = {
  slideLeft: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    transition: { duration: 0.4, ease: "easeInOut" }
  },
  slideUp: {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -100 },
    transition: { duration: 0.3, ease: "easeOut" }
  }
}

export const scaleTransitions = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2, ease: "easeOut" }
}

// CSS classes for smooth transitions
export const transitionClasses = {
  smooth: "transition-all duration-300 ease-in-out",
  fast: "transition-all duration-200 ease-out",
  slow: "transition-all duration-500 ease-in-out",
  bounce: "transition-all duration-300 ease-bounce",
  spring: "transition-all duration-400 ease-spring"
}