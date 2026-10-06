export type AutomationStatus = 'draft' | 'active' | 'paused';
export interface Post {
  id: string;
  title: string;
  kind: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  theme: 'sage' | 'sand' | 'rose' | 'ink';
  mediaUrl?: string;
  permalink?: string;
}
export interface LinkButton {
  id: string;
  label: string;
  url: string;
}
export interface Automation {
  id: string;
  name: string;
  post: Post | null;
  status: AutomationStatus;
  trigger: 'keyword' | 'all';
  match: 'contains' | 'exact';
  keywords: string[];
  openingMessage: string;
  openingButton: string;
  followMessage: string;
  profileButton: string;
  recheckButton: string;
  deliveryMessage: string;
  links: LinkButton[];
  commentReply: string;
  createdAt: string;
  updatedAt: string;
}
export type DeliveryStatus =
  'opening_sent' | 'awaiting_follow' | 'completed' | 'failed' | 'unknown';
export interface Delivery {
  id: string;
  automationId: string;
  automationName: string;
  username: string;
  comment: string;
  status: DeliveryStatus;
  createdAt: string;
  completedAt?: string;
  replySent: boolean;
  error?: string;
  links: LinkButton[];
}
export interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  connectedAt: string;
  status: 'connected' | 'reconnect';
}
export interface WorkspaceData {
  automations: Automation[];
  deliveries: Delivery[];
  account: InstagramAccount | null;
}
export interface Session {
  uid: string;
  email: string;
  workspaceId: string;
}
