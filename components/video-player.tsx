"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  className?: string
  poster?: string
  autoPlay?: boolean
}

export function VideoPlayer({ src, className, poster, autoPlay = false }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isSeekHovering, setIsSeekHovering] = useState(false)
  const [seekHoverPosition, setSeekHoverPosition] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isDraggingVolume, setIsDraggingVolume] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekBarRef = useRef<HTMLDivElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setVolume(video.volume)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('volumechange', () => setVolume(video.volume))

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('volumechange', () => setVolume(video.volume))
    }
  }, [])

  // Handle volume drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingVolume && volumeSliderRef.current && videoRef.current) {
        e.preventDefault()
        const rect = volumeSliderRef.current.getBoundingClientRect()
        const position = (e.clientX - rect.left) / rect.width
        const newVolume = Math.max(0, Math.min(1, position))
        videoRef.current.volume = newVolume
        setVolume(newVolume)
        setIsMuted(newVolume === 0)
      }
    }

    const handleMouseUp = () => {
      setIsDraggingVolume(false)
    }

    if (isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingVolume])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
      if (newMutedState) {
        videoRef.current.volume = 0
      } else {
        videoRef.current.volume = volume || 1
      }
    }
  }

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !volumeSliderRef.current) return

    const rect = volumeSliderRef.current.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    const newVolume = Math.max(0, Math.min(1, position))
    
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const startVolumeDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingVolume(true)
    handleVolumeChange(e)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current) return
    
    const rect = seekBarRef.current.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    setSeekHoverPosition(position)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !seekBarRef.current) return
    
    const rect = seekBarRef.current.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    const newTime = position * duration
    
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  return (
    <div 
      className={cn("relative group", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        setShowControls(false)
        if (!isDraggingVolume) {
          setIsDraggingVolume(false)
        }
      }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        playsInline
        autoPlay={autoPlay}
        loop={false}
        muted={isMuted}
        onClick={(e) => e.stopPropagation()}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* Overlay controls */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity", 
          (isPlaying && !showControls) ? "opacity-0" : "opacity-100"
        )}
      >
        <button 
          type="button"
          onClick={togglePlay}
          className="p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8" />
          )}
        </button>
      </div>
      
      {/* Bottom controls */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex flex-col gap-2 transition-opacity",
          (isPlaying && !showControls) ? "opacity-0" : "opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Seeker bar */}
        <div 
          ref={seekBarRef}
          className="w-full h-1 bg-white/30 rounded cursor-pointer relative group"
          onClick={handleSeek}
          onMouseMove={handleSeekHover}
          onMouseEnter={() => setIsSeekHovering(true)}
          onMouseLeave={() => setIsSeekHovering(false)}
        >
          {/* Progress bar */}
          <div 
            className="absolute top-0 left-0 h-full bg-white rounded"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          
          {/* Hover preview */}
          {isSeekHovering && (
            <>
              <div 
                className="absolute top-0 h-full w-0.5 bg-white/70"
                style={{ left: `${seekHoverPosition * 100}%` }}
              />
              <div 
                className="absolute -top-8 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded"
                style={{ left: `${seekHoverPosition * 100}%` }}
              >
                {formatTime(seekHoverPosition * duration)}
              </div>
            </>
          )}
        </div>
        
        {/* Controls row */}
        <div className="flex items-center gap-4">
          {/* Volume controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 text-white hover:text-gray-300 transition"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            
            {/* Horizontal volume slider */}
            <div 
              ref={volumeSliderRef}
              className="w-20 h-1 bg-white/30 rounded cursor-pointer relative group"
              onClick={handleVolumeChange}
              onMouseDown={startVolumeDrag}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-white rounded"
                style={{ width: `${volume * 100}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full -mt-px"
                style={{ left: `calc(${volume * 100}% - 6px)` }}
              />
            </div>
          </div>
          
          {/* Time display */}
          <div className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  )
} 