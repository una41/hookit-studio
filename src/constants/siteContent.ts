export interface IContactInfo {
  owner_name: string
  owner_role: string
  phone: string
  email: string
  instagram_id: string
  instagram_url: string
  kakao_url: string
  website: string
}

export interface IServiceItem {
  title: string
  description: string
}

export interface IBusinessInfoItem {
  label: string
  value: string
}

export interface IStrategyItem {
  type_name: string
  count: string
  role: string
  description: string
}

export interface IProcessItem {
  title: string
  description: string
}

export const CONTACT_INFO: IContactInfo = {
  owner_name: '이유나',
  owner_role: '총괄 PD',
  phone: '010-2841-4017',
  email: 'una8206@naver.com',
  instagram_id: '@hookit_studio',
  instagram_url: 'https://www.instagram.com/hookit_studio',
  // TODO: 카카오톡 채널 또는 오픈채팅 링크로 교체
  kakao_url: '#',
  website: 'hookitstudio.kr',
}

export const TARGET_LIST: string[] = ['변호사', '의사', '세무사', '전문직 대표님']

export const SERVICE_LIST: IServiceItem[] = [
  { title: '편집 · 후보정', description: '전문직의 신뢰감이 살아나도록 컷, 자막, 색감까지 다듬습니다.' },
  { title: '캡션 제작', description: '댓글과 문의를 부르는 캡션과 CTA 문구를 작성합니다.' },
  { title: '썸네일 제작', description: '프로필 첫 화면에서 눈에 띄는 일관된 썸네일을 만듭니다.' },
  { title: '전자책 제작', description: '댓글 한 번으로 받아가는 PDF 자료를 만들어 잠재고객을 모읍니다.' },
  { title: '스케줄링', description: '업로드 순서와 일정을 전략에 맞게 관리합니다.' },
  { title: '자동 DM', description: '댓글 → DM → 자료 전달까지 자동으로 이어지게 설계합니다.' },
]

export const STRATEGY_LIST: IStrategyItem[] = [
  {
    type_name: '노출형',
    count: '3편',
    role: '발견',
    description: '새로운 타깃을 계정으로 데려오고 평균 노출도를 높입니다.',
  },
  {
    type_name: '인간미형',
    count: '3편',
    role: '호감',
    description: '대표님의 성격과 태도를 보여주어 친밀감과 신뢰를 만듭니다.',
  },
  {
    type_name: '전문가형',
    count: '3편',
    role: '전환',
    description: '전문성을 증명하고 댓글, DM, 팔로우로 잠재고객을 확보합니다.',
  },
  {
    type_name: '모집형',
    count: '1편',
    role: '매출',
    description: '쌓인 신뢰를 상담 신청과 결제로 연결합니다.',
  },
]

export const PROCESS_LIST: IProcessItem[] = [
  { title: '상담', description: '판매 상품과 타깃을 확인합니다.' },
  { title: '기획', description: '3331 구성에 맞춰 릴스 10편을 기획합니다.' },
  { title: '제작', description: '전달받은 영상을 편집, 후보정하고 캡션과 썸네일을 만듭니다.' },
  { title: '운영', description: '노출형부터 순서대로 업로드하고 자동 DM을 연결합니다.' },
  { title: '리포트', description: '유형별 지표를 확인하고 다음 콘텐츠에 반영합니다.' },
]

export const STRENGTH_LIST: IServiceItem[] = [
  {
    title: '직업별 맞춤 기획',
    description: '변호사, 의사, 세무사 등 분야별 이해도가 높은 전문 기획자를 배치해 매출로 이어질 수 있게 설계합니다.',
  },
  {
    title: '1:1 배치',
    description: '공장형 찍어내기 콘텐츠가 아닙니다. 광고주 한 분당 한 명의 전담 PD가 처음부터 끝까지 함께합니다.',
  },
  {
    title: '릴스 + 채널 확장 운영',
    description: '릴스뿐 아니라 유튜브, 블로그, 스레드 등 원하는 타깃이 있는 곳이면 어디든 맞춤 마케팅이 가능합니다.',
  },
]

export const WORKFLOW_LIST: string[] = ['기획', '편집', '업로드 · 운영']

// TODO: 상호와 사업자번호는 임시값, 실제 값으로 교체
export const BUSINESS_INFO: IBusinessInfoItem[] = [
  { label: '상호', value: '회사명' },
  { label: '대표이사', value: '이유나' },
  { label: '사업자번호', value: '0002' },
  { label: '사업장주소', value: '수원시 권선구 망포로 13' },
  { label: '대표전화', value: '010-2641-9218' },
]

// 관리자 로그인: 아이디만 입력하면 이 도메인을 붙여 Firebase 계정(이메일 형식)으로 로그인
// Firebase 콘솔에서 만든 관리자 계정과, firestore.rules의 관리자 이메일이 같아야 함
export const ADMIN_LOGIN_DOMAIN = 'hookitstudio.kr'
export const ADMIN_LOGIN_EMAIL = 'yn8206@gmail.com'
