import { STRATEGY_LIST } from '../../constants/siteContent'

export default function StrategySection() {
  return (
    <section className='bx_section center light bx_strategy' id='strategy'>
      <span className='bg_word' aria-hidden='true'>
        3331.
      </span>
      <span className='bg_dot' aria-hidden='true' />
      <span className='bg_outline' aria-hidden='true' />
      <span className='bg_fill' aria-hidden='true' />
      <div className='bx_inner'>
        <p className='txt_eyebrow'>3331 전략</p>
        <h2 className='tit_section'>
          릴스 10편으로 만드는
          <br />
          고객 전환 구조
        </h2>
        <p className='txt_section_desc'>
          조회수가 높다고 매출이 생기지는 않습니다. 구매 가능성이 높은 타깃이 보고 행동하도록 10편을 구성합니다.
        </p>
        <p className='txt_flow'>노출 → 호감 → 신뢰 → 잠재고객 확보 → 매출</p>
        <ul className='list_strategy'>
          {STRATEGY_LIST.map((strategy) => (
            <li key={strategy.type_name}>
              <span className='txt_role'>{strategy.role}</span>
              <strong className='tit_card'>{strategy.type_name}</strong>
              <span className='num'>{strategy.count}</span>
              <p className='txt_card'>{strategy.description}</p>
            </li>
          ))}
        </ul>
        <p className='txt_note'>첫 업로드는 반드시 노출형으로 시작해 계정의 노출 체력부터 확보합니다.</p>
      </div>
    </section>
  )
}
