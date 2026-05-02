"use client"

let lastPlayed = 0

export function playNotificationSound(force = false) {
  if (typeof window === "undefined") return
  const now = Date.now()
  if (!force && now - lastPlayed < 1500) return
  lastPlayed = now
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close().catch(() => {})
  } catch {
    // ignore audio errors (autoplay policy etc.)
  }
}
