import { PROCESS_LIST } from '../../constants/siteContent'

export default function ProcessSection() {
  return (
    <section className='bx_section full center gray bx_process' id='process'>
      <span className='bg_step' aria-hidden='true'>
        STEP
      </span>
      <span className='bg_ring' aria-hidden='true' />
      <div className='bx_inner'>
        <p className='txt_eyebrow'>진행 과정</p>
        <h2 className='tit_section'>진행 과정</h2>
        <ol className='list_process'>
          {PROCESS_LIST.map((process, process_index) => (
            <li key={process.title}>
              <span className='num'>{process_index + 1}</span>
              <strong className='tit_card'>{process.title}</strong>
              <p className='txt_card'>{process.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
