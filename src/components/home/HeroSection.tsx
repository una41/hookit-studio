import BaseButton from '../common/BaseButton'
import { TARGET_LIST } from '../../constants/siteContent'

export default function HeroSection() {
  return (
    <section className='bx_hero' id='top'>
      <div className='bx_inner'>
        <p className='txt_eyebrow'>MEDIA PRODUCTION</p>
        <h1 className='tit_hero'>
          보기 좋은 영상을 넘어
          <br />
          <em>팔리는 영상</em>으로
        </h1>
        <p className='txt_hero_desc'>
          노출부터 신뢰, 문의, 매출 전환까지 이어지는 릴스 콘텐츠 구조를 설계합니다.
        </p>
        <ul className='list_target'>
          {TARGET_LIST.map((target_name) => (
            <li key={target_name}>{target_name}</li>
          ))}
        </ul>
        <div className='bx_button_group'>
          <BaseButton href='#contact'>무료 상담 문의</BaseButton>
          <BaseButton href='#service' modifier='line'>
            서비스 보기
          </BaseButton>
        </div>
        <div className='bar_progress' aria-hidden='true' />
      </div>
    </section>
  )
}
