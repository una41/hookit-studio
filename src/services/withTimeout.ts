const TIMEOUT_MILLISECOND = 10000

// Firestore는 연결이 안 되면 오류 없이 계속 대기하므로, 시간 안에 끝나지 않으면 실패로 처리
export const withTimeout = <T>(task_promise: Promise<T>, error_message: string): Promise<T> => {
  const timeout_promise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(error_message)), TIMEOUT_MILLISECOND)
  })
  return Promise.race([task_promise, timeout_promise])
}
