"use client"

import { motion } from "framer-motion"

interface BrandBackdropProps {
  className?: string
}

export default function BrandBackdrop({ className }: BrandBackdropProps) {
  return (
    <div
      aria-hidden
      className={
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#06070a] " + (className || "")
      }
    >
      {/* Base radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,57,42,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(232,57,42,0.08),transparent_60%)]" />

      {/* Grid mask, fading at edges */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)",
        }}
      />

      {/* Diagonal scan beams */}
      <div className="absolute inset-x-0 top-[-20%] h-[120%] opacity-50">
        <div className="absolute left-[8%] top-0 h-full w-[2px] rotate-[14deg] bg-gradient-to-b from-transparent via-[rgba(232,57,42,0.35)] to-transparent blur-[2px]" />
        <div className="absolute right-[14%] top-0 h-full w-[2px] -rotate-[10deg] bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.18)] to-transparent blur-[2px]" />
      </div>

      {/* Red aurora orb */}
      <motion.div
        className="absolute left-1/2 top-[-12%] h-[70vw] w-[70vw] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(232,57,42,0.32) 0%, rgba(232,57,42,0.12) 35%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottom soft glow */}
      <motion.div
        className="absolute -bottom-[20%] left-[8%] h-[60vw] w-[60vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,107,94,0.22) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
        animate={{ scale: [1.05, 0.95, 1.05], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* White accent glow */}
      <motion.div
        className="absolute -bottom-[10%] right-[5%] h-[35vw] w-[35vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />

      {/* Sparks */}
      {Array.from({ length: 26 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            width: `${(index % 3) + 2}px`,
            height: `${(index % 3) + 2}px`,
            left: `${(index * 17) % 100}%`,
            top: `${(index * 31) % 100}%`,
            background: index % 3 === 0 ? "#ff8c7d" : index % 3 === 1 ? "#ffffff" : "#E8392A",
            opacity: 0.18,
            boxShadow: "0 0 8px currentColor",
          }}
          animate={{ y: [0, -22, 0], opacity: [0.08, 0.45, 0.08] }}
          transition={{
            duration: 4.8 + (index % 5),
            repeat: Infinity,
            delay: index * 0.18,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Top fade for navbar contrast */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
    </div>
  )
}
