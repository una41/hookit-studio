import { SERVICE_LIST } from '../../constants/siteContent'

const MARQUEE_REPEAT_LIST: number[] = [1, 2]

export default function ServiceSection() {
  return (
    <section className='bx_section center point bx_service' id='service'>
      <span className='bg_dots' aria-hidden='true' />
      <span className='bg_ring_top' aria-hidden='true' />
      <div className='bx_inner'>
        <p className='txt_eyebrow'>서비스</p>
        <h2 className='tit_section'>
          릴스가 매출이 되도록,
          <br />
          필요한 작업을 한 번에
        </h2>
        <p className='txt_section_desc'>
          영상만 만들어 드리지 않습니다. 올라가는 순간부터 문의로 이어질 때까지 필요한 작업을 모두 맡아 드립니다.
        </p>
        <ul className='list_service'>
          {SERVICE_LIST.map((service, service_index) => (
            <li key={service.title}>
              <span className='num'>{String(service_index + 1).padStart(2, '0')}</span>
              <strong className='tit_card'>{service.title}</strong>
              <p className='txt_card'>{service.description}</p>
            </li>
          ))}
        </ul>
        <p className='txt_service_extra'>
          <strong>웹 · 앱 구축</strong>도 가능합니다. 전문 개발자와 디자이너가 함께 있어, 릴스로 모인 관심이 문의와 매출로 이어지는 홈페이지와 앱을 만들어 드립니다.
        </p>
      </div>
      <div className='bx_marquee' aria-hidden='true'>
        <div className='list_marquee'>
          {MARQUEE_REPEAT_LIST.map((repeat_number) => (
            <div className='bx_marquee_group' key={repeat_number}>
              <span>SCROLL STOP</span>
              <i />
              <span className='point'>HOOK</span>
              <i />
              <span>GROW</span>
              <i />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
