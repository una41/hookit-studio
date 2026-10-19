import { STRENGTH_LIST, WORKFLOW_LIST } from '../../constants/siteContent'

export default function WhySection() {
  return (
    <section className='bx_section light' id='why'>
      <div className='bx_inner bx_why'>
        <div className='bx_why_intro'>
          <p className='txt_eyebrow'>WHY HOOKIT</p>
          <h2 className='tit_section'>
            제대로 설계된 콘텐츠만이
            <br />
            <em>매출 증가</em>로 이어집니다.
          </h2>
          <p className='txt_section_desc'>
            대부분의 대행사는 <strong>'예쁜 영상'</strong>을 만듭니다.
            <br />
            우리는 <strong>'팔리는 채널'</strong>을 설계합니다.
          </p>
          <div className='bx_flow'>
            <strong className='tit_flow'>
              기획 → 편집 → 운영 <em>올인원</em>
            </strong>
            <p className='txt_card'>
              대표님은 영상만 전달해 주세요.
              <br />
              기획, 편집, 업로드, 자동 DM, 최적화까지 저희가 전담합니다.
            </p>
            <ol className='list_flow'>
              {WORKFLOW_LIST.map((step_name, step_index) => (
                <li key={step_name}>
                  <span className='num'>{step_index + 1}</span>
                  <span className='txt_step'>{step_name}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <ul className='list_strength'>
          {STRENGTH_LIST.map((strength, strength_index) => (
            <li key={strength.title}>
              <span className='num'>{String(strength_index + 1).padStart(2, '0')}</span>
              <div>
                <strong className='tit_card'>{strength.title}</strong>
                <p className='txt_card'>{strength.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
