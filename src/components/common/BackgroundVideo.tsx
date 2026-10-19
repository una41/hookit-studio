// 화면에 고정된 배경 영상 (정방향 + 역방향을 이어 붙인 bg_loop.mp4를 반복 재생, 음소거 필수)
export default function BackgroundVideo() {
  return (
    <div className='bx_background_video' aria-hidden='true'>
      <video src='/img/bg_loop.mp4' autoPlay muted loop playsInline preload='auto' />
    </div>
  )
}
