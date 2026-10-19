import Logo from '../common/Logo'
import { BUSINESS_INFO, CONTACT_INFO } from '../../constants/siteContent'

export default function TheFooter() {
  return (
    <footer className='bx_footer'>
      <span className='bg_footer_word' aria-hidden='true'>
        HOOKIT
      </span>
      <div className='bx_inner'>
        <div className='bx_footer_top'>
          <div>
            <Logo modifier='small' />
            <p className='txt_footer_desc'>전문직을 위한 릴스 · 숏폼 마케팅 스튜디오</p>
          </div>
          <ul className='list_footer_link'>
            <li>
              <span className='txt_label'>인스타그램</span>
              <a href={CONTACT_INFO.instagram_url} target='_blank' rel='noreferrer'>
                {CONTACT_INFO.instagram_id}
              </a>
            </li>
            <li>
              <span className='txt_label'>문의</span>
              <a href='#contact'>무료 상담 신청</a>
            </li>
          </ul>
        </div>
        <ul className='list_business'>
          {BUSINESS_INFO.map((business) => (
            <li key={business.label}>
              <span className='txt_label'>{business.label}</span> {business.value}
            </li>
          ))}
        </ul>
        <p className='txt_copy'>© <time>2026</time> HOOKIT STUDIO. 모든 권리 보유.</p>
      </div>
    </footer>
  )
}
