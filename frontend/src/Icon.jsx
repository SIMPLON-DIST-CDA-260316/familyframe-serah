const paths = {
  frame: <><path d="M3 4h18v16H3z" /><path d="M6 7h12v10H6z" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="16" cy="8" r="2" /><path d="m3 17 6-6 4 4 3-3 5 5" /></>,
  camera: <><path d="M14 5h-4L8 8H4a1 1 0 0 0-1 1v10h18V9a1 1 0 0 0-1-1h-4z" /><circle cx="12" cy="13" r="3" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
}

export default function Icon({ name, className = '' }) {
  return (
    <svg className={`icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  )
}
