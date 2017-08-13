export const line = ([x0, y0], [x1, y1]) => {
  const dx = x1 - x0
      , dy = y1 - y0
  return t => [x0 + t * dx, y0 + t * dy]
}

export const offsetXY = el => {
  if (!el) return [0, 0]
  const [x0, y0] = offsetXY(el.offsetParent)
      , {offsetLeft: x,
         offsetTop: y} = el
  return [x0 + x, y0 + y]
}