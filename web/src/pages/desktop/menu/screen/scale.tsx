import { ReactElement, useEffect } from 'react'
import { Popover, Slider } from 'antd'
import { useAtom } from 'jotai'
import { ScalingIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { videoScaleAtom } from '@/jotai/screen.ts'
import * as storage from '@/lib/localstorage.ts'

export const Scale = (): ReactElement => {
  const { t } = useTranslation()

  const [videoScale, setVideoScale] = useAtom(videoScaleAtom)

  useEffect(() => {
    const scale = storage.getVideoScale()
    if (scale) {
      setVideoScale(scale)
    }
  }, [setVideoScale])

  async function updateScale(scale: number): Promise<void> {
    setVideoScale(scale)
    storage.setVideoScale(scale)
  }

  const content = (
    <div className="h-[150px] w-[60px] py-3">
      <Slider
        vertical
        marks={{
          0.5: <span>x0.5</span>,
          1: <span>x1.0</span>,
          1.5: <span>x1.5</span>,
          2: <span>x2.0</span>
        }}
        range={false}
        included={false}
        min={0.5}
        max={2}
        step={0.1}
        defaultValue={videoScale}
        onChange={updateScale}
      />
    </div>
  )

  return (
    <Popover content={content} placement="rightTop" arrow={false} align={{ offset: [13, 0] }}>
      <div className="flex h-[30px] cursor-pointer items-center space-x-1 rounded px-3 text-neutral-300 hover:bg-neutral-700/50">
        <div className="flex h-[14px] w-[20px] items-end">
          <ScalingIcon size={16} />
        </div>
        <span>{t('screen.scale')}</span>
      </div>
    </Popover>
  )
}