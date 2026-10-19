import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ContactChoice from './ContactChoice'
import ContactForm from './ContactForm'
import ContactDone from './ContactDone'

type TContactView = 'choose' | 'form' | 'done'

const CONTACT_TAG_LIST: string[] = ['상담 무료', '48시간 내 연락', '변호사 · 의사 · 세무사 전문']

export default function ContactSection() {
  const [contact_view, setContactView] = useState<TContactView>('choose')
  const [card_height, setCardHeight] = useState<number | undefined>(undefined)
  const [is_visible, setIsVisible] = useState<boolean>(false)
  const section_ref = useRef<HTMLElement>(null)
  const view_element_list = useRef<Record<TContactView, HTMLDivElement | null>>({ choose: null, form: null, done: null })

  // 현재 화면의 높이를 카드 높이로 따라가서, 화면이 바뀌면 세로만 부드럽게 늘어나고 줄어듦
  useLayoutEffect(() => {
    const active_element = view_element_list.current[contact_view]
    if (!active_element) return
    setCardHeight(active_element.offsetHeight)
    const resize_observer = new ResizeObserver(() => setCardHeight(active_element.offsetHeight))
    resize_observer.observe(active_element)
    return () => resize_observer.disconnect()
  }, [contact_view])

  // 섹션이 화면에 보이기 시작하면 한 번만 등장 효과를 켬
  useEffect(() => {
    const section = section_ref.current
    if (!section) return
    const intersection_observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          intersection_observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    intersection_observer.observe(section)
    return () => intersection_observer.disconnect()
  }, [])

  // 문의하기를 누르면 헤더의 '무료 상담 신청'을 누른 것처럼 섹션을 헤더 바로 아래에 맞춤
  const handleOpenForm = () => {
    setContactView('form')
    section_ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // 세 화면을 같은 자리에 겹쳐 두고 현재 화면만 페이드로 보여줌
  const getViewProps = (view_name: TContactView) => ({
    className: contact_view === view_name ? 'view_contact open' : 'view_contact',
    inert: contact_view !== view_name,
    ref: (element: HTMLDivElement | null) => {
      view_element_list.current[view_name] = element
    },
  })

  return (
    <section ref={section_ref} className={is_visible ? 'bx_section full point bx_contact visible' : 'bx_section full point bx_contact'} id='contact'>
      <span className='bg_hello' aria-hidden='true'>
        HELLO
      </span>
      <span className='bg_ring_top' aria-hidden='true' />
      <div className='bx_inner bx_contact_panel'>
        <div className='bx_contact_text'>
          <p className='txt_eyebrow'>상담 문의</p>
          <h2 className='tit_section'>
            귀하의 전문성,
            <br />
            이제 <em>채널</em>이 되어야 합니다.
          </h2>
          <p className='txt_section_desc'>
            HOOKIT STUDIO가 기획부터 성장까지 함께합니다.
            <br />
            지금 무료 상담을 신청하면, 48시간 내 연락드립니다.
          </p>
          <ul className='list_tag'>
            {CONTACT_TAG_LIST.map((tag_name) => (
              <li key={tag_name}>{tag_name}</li>
            ))}
          </ul>
        </div>
        <div className='card_contact' style={{ height: card_height }}>
          <div {...getViewProps('choose')}>
            <ContactChoice onOpenForm={handleOpenForm} />
          </div>
          <div {...getViewProps('form')}>
            <ContactForm onBack={() => setContactView('choose')} onSubmitted={() => setContactView('done')} />
          </div>
          <div {...getViewProps('done')}>
            <ContactDone onReset={() => setContactView('choose')} />
          </div>
        </div>
      </div>
    </section>
  )
}
