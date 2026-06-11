import { Composition } from 'remotion'
import { EventScherm, FPS, DURATION_FRAMES } from './EventScherm'

export const RemotionRoot = () => {
  return (
    <Composition
      id="EventScherm"
      component={EventScherm}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  )
}
