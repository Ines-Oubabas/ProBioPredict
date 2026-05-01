function IconBase({ children, className = 'icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {children}
    </svg>
  )
}

export function IconMail(props) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16v12H4z" />
      <path d="m4 8 8 6 8-6" />
    </IconBase>
  )
}

export function IconLock(props) {
  return (
    <IconBase {...props}>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </IconBase>
  )
}

export function IconUser(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </IconBase>
  )
}

export function IconChart(props) {
  return (
    <IconBase {...props}>
      <path d="M4 19h16" />
      <path d="M7 16v-5" />
      <path d="M12 16V8" />
      <path d="M17 16v-3" />
    </IconBase>
  )
}

export function IconBolt(props) {
  return (
    <IconBase {...props}>
      <path d="M13 2 5 13h6l-1 9 8-11h-6z" />
    </IconBase>
  )
}

export function IconShield(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5 6v6c0 5 3.5 8.5 7 9 3.5-.5 7-4 7-9V6z" />
      <path d="m9.5 12 2 2 3-3" />
    </IconBase>
  )
}

export function IconUpload(props) {
  return (
    <IconBase {...props}>
      <path d="M12 16V6" />
      <path d="m8 10 4-4 4 4" />
      <rect x="4" y="16" width="16" height="4" rx="1.5" />
    </IconBase>
  )
}

export function IconSpark(props) {
  return (
    <IconBase {...props}>
      <path d="m12 2 1.8 4.2L18 8l-4.2 1.8L12 14l-1.8-4.2L6 8l4.2-1.8L12 2z" />
      <path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z" />
    </IconBase>
  )
}