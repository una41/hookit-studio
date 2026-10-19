interface ILogoProps {
  modifier?: string
}

// 로고: HOOKIT의 두 번째 O가 링 모양
export default function Logo({ modifier = '' }: ILogoProps) {
  return (
    <span className={['logo', modifier].join(' ').trim()} aria-label='HOOKIT STUDIO'>
      <span className='logo_line'>
        HO<span className='logo_ring' />KIT
      </span>
      <span className='logo_line'>STUDIO</span>
    </span>
  )
}
