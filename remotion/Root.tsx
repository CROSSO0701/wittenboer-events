import { Composition } from 'remotion'
import { EventScherm, FPS, DURATION_FRAMES } from './EventScherm'
import { EventScherm3D } from './EventScherm3D'

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="EventScherm"
        component={EventScherm}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="EventScherm3D"
        component={EventScherm3D}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  )
}
