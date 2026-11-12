/** Read an image file, scale it down (max side = `max` px) and return a compact data URL */
export function fileToDataURL(file, max = 384) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(img.width * k))
      c.height = Math.max(1, Math.round(img.height * k))
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      let out = c.toDataURL('image/webp', 0.88)
      if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/png')
      resolve(out)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Cannot read image'))
    }
    img.src = url
  })
}
