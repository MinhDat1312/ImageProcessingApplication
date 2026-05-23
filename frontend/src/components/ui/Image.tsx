import React, { useState } from 'react'
import { Skeleton } from 'antd'

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string | number
  cover?: boolean
  placeholder?: boolean
}

export const Image: React.FC<ImageProps> = ({ aspectRatio, cover = false, placeholder = true, style, ...rest }) => {
  const [loaded, setLoaded] = useState(false)

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: aspectRatio ? 'auto' : '100%',
    objectFit: cover ? 'cover' : 'contain',
    display: loaded ? 'block' : 'none',
    ...style,
  }

  return (
    <div style={{ width: '100%', height: aspectRatio ? undefined : '100%', display: 'block', position: 'relative' }}>
      {placeholder && !loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Skeleton.Image active style={{ width: '70%', height: 120 }} />
        </div>
      )}
      <img
        {...rest}
        style={imgStyle}
        onLoad={(e) => {
          setLoaded(true)
          if (rest.onLoad) rest.onLoad(e)
        }}
      />
    </div>
  )
}

export default Image
