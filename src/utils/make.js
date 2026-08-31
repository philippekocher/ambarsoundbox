export function make(tag, props = {}, children = []) {
  const el = document.createElement(tag)
  Object.entries(props).forEach(([key, v]) => {
    if (key === 'className') el.className = v
    else if (key === 'dataset') Object.assign(el.dataset, v)
    else if (key === 'text') el.textContent = v
    else if (key === 'html') el.innerHTML = v
    else if (key === 'attrs') Object.entries(v).forEach(([a, val]) => el.setAttribute(a, val))
    else el[key] = v
  })
  children.forEach(c => el.appendChild(c))
  return el
}