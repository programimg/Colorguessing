import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Eye, EyeOff, Trophy, RotateCcw, Zap, Target, Award, ChevronRight } from 'lucide-react'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'

interface HSLColor {
  h: number
  s: number
  l: number
}

type GamePhase = 'idle' | 'showing' | 'guessing' | 'result' | 'gameOver'

const ROUND_OPTIONS = [3, 5, 7, 10] as const

function generateRandomColor(): HSLColor {
  return {
    h: Math.floor(Math.random() * 360),
    s: Math.floor(Math.random() * 60) + 40, // 40-100% for visible colors
    l: Math.floor(Math.random() * 50) + 25, // 25-75% for visible colors
  }
}

function calculateScore(original: HSLColor, guess: HSLColor): number {
  // Hue is circular (0-360), so we need special handling
  let hueDiff = Math.abs(original.h - guess.h)
  if (hueDiff > 180) hueDiff = 360 - hueDiff
  
  const satDiff = Math.abs(original.s - guess.s)
  const lightDiff = Math.abs(original.l - guess.l)
  
  // Weight: Hue matters most, then saturation, then lightness
  const hueScore = Math.max(0, 100 - (hueDiff / 180) * 100)
  const satScore = Math.max(0, 100 - satDiff)
  const lightScore = Math.max(0, 100 - lightDiff)
  
  // Weighted average: 50% hue, 30% saturation, 20% lightness
  const totalScore = (hueScore * 0.5) + (satScore * 0.3) + (lightScore * 0.2)
  
  return Math.round(totalScore)
}

function getScoreMessage(score: number): { text: string } {
  if (score >= 95) return { text: 'Perfect match' }
  if (score >= 85) return { text: 'Excellent' }
  if (score >= 70) return { text: 'Great job' }
  if (score >= 50) return { text: 'Solid' }
  if (score >= 30) return { text: 'Keep going' }
  return { text: 'Try again' }
}

function getFinalMessage(avgScore: number): { text: string } {
  if (avgScore >= 90) return { text: 'Color Master' }
  if (avgScore >= 75) return { text: 'Color Expert' }
  if (avgScore >= 60) return { text: 'Good eye' }
  if (avgScore >= 40) return { text: 'Making progress' }
  return { text: 'Keep practicing' }
}

function hslToString(color: HSLColor): string {
  return `hsl(${color.h}, ${color.s}%, ${color.l}%)`
}

function HSLSlider({ 
  label, 
  value, 
  max, 
  onChange, 
  gradient,
  disabled 
}: { 
  label: string
  value: number
  max: number
  onChange: (v: number) => void
  gradient: string
  disabled: boolean
}) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs sm:text-sm font-medium text-foreground/80">{label}</label>
        <span className="text-xs sm:text-sm font-mono text-amber-300 bg-black/20 px-2 py-0.5 rounded-md border border-white/10">
          {value}{label === 'Hue' ? '°' : '%'}
        </span>
      </div>
      <div className="relative">
        <div 
          className="absolute inset-0 rounded-full h-3 sm:h-4 top-1/2 -translate-y-1/2"
          style={{ background: gradient }}
        />
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="relative w-full h-3 sm:h-4 appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 
            sm:[&::-webkit-slider-thumb]:w-6 sm:[&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-110
            [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 sm:[&::-moz-range-thumb]:w-6 sm:[&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/30"
        />
      </div>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [totalRounds, setTotalRounds] = useState<number>(3)
  const [targetColor, setTargetColor] = useState<HSLColor>({ h: 0, s: 50, l: 50 })
  const [guessColor, setGuessColor] = useState<HSLColor>({ h: 180, s: 50, l: 50 })
  const [timeLeft, setTimeLeft] = useState(10)
  const [score, setScore] = useState<number | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [roundsPlayed, setRoundsPlayed] = useState(0)
  const [roundScores, setRoundScores] = useState<number[]>([])

  const startRound = useCallback(() => {
    const newColor = generateRandomColor()
    setTargetColor(newColor)
    setGuessColor({ h: 180, s: 50, l: 50 })
    setPhase('showing')
    setTimeLeft(10)
    setScore(null)
  }, [])

  const startNewGame = useCallback((rounds: number) => {
    setTotalRounds(rounds)
    setTotalScore(0)
    setRoundsPlayed(0)
    setRoundScores([])
    const newColor = generateRandomColor()
    setTargetColor(newColor)
    setGuessColor({ h: 180, s: 50, l: 50 })
    setPhase('showing')
    setTimeLeft(10)
    setScore(null)
  }, [])

  const submitGuess = useCallback(() => {
    const roundScore = calculateScore(targetColor, guessColor)
    setScore(roundScore)
    setTotalScore(prev => prev + roundScore)
    setRoundsPlayed(prev => prev + 1)
    setRoundScores(prev => [...prev, roundScore])
    setPhase('result')
  }, [targetColor, guessColor])

  const nextRound = useCallback(() => {
    if (roundsPlayed >= totalRounds) {
      setPhase('gameOver')
    } else {
      startRound()
    }
  }, [roundsPlayed, totalRounds, startRound])

  const resetGame = useCallback(() => {
    setPhase('idle')
    setTotalScore(0)
    setRoundsPlayed(0)
    setRoundScores([])
    setScore(null)
  }, [])

  // Timer for showing phase
  useEffect(() => {
    if (phase !== 'showing') return
    
    if (timeLeft <= 0) {
      setPhase('guessing')
      return
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, timeLeft])

  const hueGradient = 'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))'
  const satGradient = `linear-gradient(to right, hsl(${guessColor.h},0%,${guessColor.l}%), hsl(${guessColor.h},100%,${guessColor.l}%))`
  const lightGradient = `linear-gradient(to right, hsl(${guessColor.h},${guessColor.s}%,0%), hsl(${guessColor.h},${guessColor.s}%,50%), hsl(${guessColor.h},${guessColor.s}%,100%))`

  const isLastRound = roundsPlayed >= totalRounds

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        <div className="max-w-5xl mx-auto px-3 py-3 sm:px-6 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 text-foreground flex items-center justify-center shadow-sm ring-1 ring-white/15">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
              Color Memory
            </h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <AnimatedThemeToggle className="p-2" />
            
            {(phase !== 'idle' && phase !== 'gameOver') && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-amber-300">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-mono text-base sm:text-lg tabular-nums">{totalScore}</span>
              </div>
            )}
            <div className="text-muted-foreground text-xs sm:text-sm tabular-nums">
              Round {Math.min(roundsPlayed + (phase === 'result' ? 0 : 1), totalRounds)}/{totalRounds}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-10">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {/* Idle State */}
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6 sm:space-y-10"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Precision memory game
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
                    Train your eye for color
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-lg max-w-lg mx-auto px-4">
                    Memorize a color in 10 seconds, then recreate it using HSL sliders. Score is weighted toward hue accuracy.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto text-xs sm:text-sm px-2">
                  <div className="text-left bg-card/70 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 shadow-[var(--shadow-soft)]">
                    <div className="flex items-start justify-between">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Phase 1</span>
                    </div>
                    <p className="mt-3 font-semibold text-foreground/90">Memorize</p>
                    <p className="mt-1 text-muted-foreground leading-relaxed">Study the color for 10 seconds.</p>
                  </div>
                  <div className="text-left bg-card/70 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 shadow-[var(--shadow-soft)]">
                    <div className="flex items-start justify-between">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-rose-300" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Phase 2</span>
                    </div>
                    <p className="mt-3 font-semibold text-foreground/90">Recreate</p>
                    <p className="mt-1 text-muted-foreground leading-relaxed">Adjust hue, saturation, and lightness.</p>
                  </div>
                  <div className="text-left bg-card/70 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 shadow-[var(--shadow-soft)]">
                    <div className="flex items-start justify-between">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Phase 3</span>
                    </div>
                    <p className="mt-3 font-semibold text-foreground/90">Score</p>
                    <p className="mt-1 text-muted-foreground leading-relaxed">Hue matters most. Aim for consistency.</p>
                  </div>
                </div>

                {/* Round Selection */}
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-muted-foreground text-sm sm:text-base">Choose number of rounds</p>
                  <div className="grid grid-cols-4 gap-2 sm:flex sm:justify-center sm:gap-4 max-w-xs sm:max-w-none mx-auto">
                    {ROUND_OPTIONS.map((rounds) => (
                      <motion.button
                        key={rounds}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startNewGame(rounds)}
                        className="group relative px-3 sm:px-8 py-3 sm:py-4 bg-card/70 hover:bg-card/90 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg transition-all shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]"
                      >
                        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-rose-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                            {rounds}
                          </span>
                          <span className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                            rounds
                          </span>
                        </div>
                        <ChevronRight className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs sm:text-sm">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Click a round option to start</span>
                </div>
              </motion.div>
            )}

            {/* Showing Phase */}
            {phase === 'showing' && (
              <motion.div
                key="showing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="text-center space-y-1 sm:space-y-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-300">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base">Memorize this color!</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-mono font-bold text-amber-300 tabular-nums">
                    {timeLeft}s
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-[4/3] sm:aspect-video rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 ring-1 ring-white/10 overflow-hidden"
                  style={{ backgroundColor: hslToString(targetColor) }}
                />

                <div className="h-2 bg-card/60 backdrop-blur rounded-full overflow-hidden border border-border/70">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 10, ease: 'linear' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  />
                </div>
              </motion.div>
            )}

            {/* Guessing Phase */}
            {phase === 'guessing' && (
              <motion.div
                key="guessing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="text-center space-y-1 sm:space-y-2">
                  <div className="flex items-center justify-center gap-2 text-rose-300">
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base">Color hidden! Recreate it from memory</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                  {/* Color Preview */}
                  <div className="lg:col-span-2">
                    <div className="bg-card/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-white/10 shadow-[var(--shadow-card)]">
                      <div
                        className="aspect-[4/3] rounded-xl sm:rounded-2xl border border-white/10 ring-1 ring-white/10 transition-colors duration-150"
                        style={{ backgroundColor: hslToString(guessColor) }}
                      />
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Live preview</span>
                        <span className="font-mono text-foreground/80 tabular-nums">
                          H:{guessColor.h}° S:{guessColor.s}% L:{guessColor.l}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HSL Sliders */}
                  <div className="lg:col-span-3 bg-card/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5 sm:space-y-6 border border-white/10 shadow-[var(--shadow-soft)]">
                    <HSLSlider
                      label="Hue"
                      value={guessColor.h}
                      max={360}
                      onChange={(h) => setGuessColor(c => ({ ...c, h }))}
                      gradient={hueGradient}
                      disabled={false}
                    />
                    <HSLSlider
                      label="Saturation"
                      value={guessColor.s}
                      max={100}
                      onChange={(s) => setGuessColor(c => ({ ...c, s }))}
                      gradient={satGradient}
                      disabled={false}
                    />
                    <HSLSlider
                      label="Lightness"
                      value={guessColor.l}
                      max={100}
                      onChange={(l) => setGuessColor(c => ({ ...c, l }))}
                      gradient={lightGradient}
                      disabled={false}
                    />

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={submitGuess}
                      className="w-full py-3.5 sm:py-4 bg-gradient-to-b from-white to-white/90 text-background rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg shadow-[var(--shadow-soft)] ring-1 ring-white/20 hover:opacity-95"
                    >
                      Submit guess
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Result Phase */}
            {phase === 'result' && score !== null && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="text-center space-y-1 sm:space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold">{getScoreMessage(score).text}</h2>
                  <div className="text-4xl sm:text-5xl font-mono font-bold text-amber-300 tabular-nums">
                    {score} <span className="text-xl sm:text-2xl text-slate-500">/ 100</span>
                  </div>
                </div>

                {/* Color Comparison */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-center text-xs sm:text-sm text-muted-foreground">Target</p>
                    <div
                      className="aspect-square rounded-xl sm:rounded-2xl border border-white/10 shadow-[var(--shadow-soft)]"
                      style={{ backgroundColor: hslToString(targetColor) }}
                    />
                    <p className="text-center font-mono text-[10px] sm:text-sm text-muted-foreground tabular-nums">
                      H:{targetColor.h}° S:{targetColor.s}% L:{targetColor.l}%
                    </p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-center text-xs sm:text-sm text-muted-foreground">Your Guess</p>
                    <div
                      className="aspect-square rounded-xl sm:rounded-2xl border border-white/10 shadow-[var(--shadow-soft)]"
                      style={{ backgroundColor: hslToString(guessColor) }}
                    />
                    <p className="text-center font-mono text-[10px] sm:text-sm text-muted-foreground tabular-nums">
                      H:{guessColor.h}° S:{guessColor.s}% L:{guessColor.l}%
                    </p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="bg-card/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 shadow-[var(--shadow-soft)]">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">Score Breakdown</p>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hue Accuracy (50%)</span>
                      <span className="font-mono text-rose-300 tabular-nums">
                        {Math.abs(targetColor.h - guessColor.h) > 180 
                          ? 360 - Math.abs(targetColor.h - guessColor.h)
                          : Math.abs(targetColor.h - guessColor.h)}° off
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturation Accuracy (30%)</span>
                      <span className="font-mono text-violet-300 tabular-nums">
                        {Math.abs(targetColor.s - guessColor.s)}% off
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lightness Accuracy (20%)</span>
                      <span className="font-mono text-cyan-300 tabular-nums">
                        {Math.abs(targetColor.l - guessColor.l)}% off
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 sm:gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextRound}
                    className="flex-1 py-3 sm:py-4 bg-gradient-to-b from-white to-white/90 text-background rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[var(--shadow-soft)] ring-1 ring-white/20 hover:opacity-95"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    {isLastRound ? 'See Results' : 'Next Round'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetGame}
                    className="px-4 sm:px-6 py-3 sm:py-4 bg-card/60 hover:bg-card/80 backdrop-blur-md rounded-xl sm:rounded-2xl font-semibold flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 transition-colors shadow-[var(--shadow-soft)]"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap max-w-xs mx-auto">
                  {Array.from({ length: totalRounds }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                        i < roundsPlayed
                          ? 'bg-gradient-to-r from-rose-500 to-violet-500'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Game Over Phase */}
            {phase === 'gameOver' && (
              <motion.div
                key="gameOver"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6 sm:space-y-8"
              >
                <div className="space-y-2 sm:space-y-3">
                  <h2 className="text-2xl sm:text-4xl font-bold">Game Over!</h2>
                  <p className="text-lg sm:text-xl text-muted-foreground">
                    {getFinalMessage(totalScore / totalRounds).text}
                  </p>
                </div>

                {/* Final Score */}
                <div className="bg-card/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 max-w-sm mx-auto shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
                    <Award className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300" />
                    <span className="text-4xl sm:text-5xl font-mono font-bold text-amber-300 tabular-nums">
                      {totalScore}
                    </span>
                    <span className="text-xl sm:text-2xl text-slate-500">/ {totalRounds * 100}</span>
                  </div>
                  
                  <p className="text-muted-foreground text-sm sm:text-base mb-4">
                    Average: <span className="font-mono tabular-nums">{Math.round(totalScore / totalRounds)}</span> per round
                  </p>

                  {/* Round by round scores */}
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Round Scores</p>
                    <div className="grid grid-cols-5 sm:flex sm:justify-center gap-1.5 sm:gap-2 sm:flex-wrap">
                      {roundScores.map((s, i) => (
                        <div key={i} className="text-center">
                          <div className={`w-full aspect-square sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-mono font-bold text-[11px] sm:text-sm ${
                            s >= 70 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' :
                            s >= 40 ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                            'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                          }`}>
                            {s}
                          </div>
                          <p className="text-[8px] sm:text-[10px] text-slate-500 mt-0.5">R{i + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Play Again Options */}
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-muted-foreground text-sm sm:text-base">Play again?</p>
                  <div className="grid grid-cols-4 gap-2 sm:flex sm:justify-center sm:gap-3 max-w-xs sm:max-w-none mx-auto">
                    {ROUND_OPTIONS.map((rounds) => (
                      <motion.button
                        key={rounds}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startNewGame(rounds)}
                        className={`px-2 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-base transition-all ${
                          rounds === totalRounds 
                            ? 'bg-gradient-to-b from-white to-white/90 text-background shadow-[var(--shadow-soft)] ring-1 ring-white/20' 
                            : 'bg-card/60 hover:bg-card/80 backdrop-blur-md border border-white/10 hover:border-white/20 shadow-[var(--shadow-soft)]'
                        }`}
                      >
                        <span className="sm:hidden">{rounds}</span>
                        <span className="hidden sm:inline">{rounds} Rounds</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetGame}
                  className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 mx-auto transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Back to Menu
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 sm:p-4 text-center text-muted-foreground text-xs sm:text-sm border-t border-border/70 bg-background/40 backdrop-blur-xl">
        Train your eye for color • HSL Color Memory Game
      </footer>
    </div>
  )
}
