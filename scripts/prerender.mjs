import { readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// 서버용으로 빌드한 홈 화면을 dist/index.html 의 빈 root 안에 넣음
const { render } = await import(pathToFileURL(path.resolve('dist-server/entry-server.js')).href)
const html = await readFile('dist/index.html', 'utf8')
const empty_root = '<div id="root"></div>'

if (!html.includes(empty_root)) throw new Error('dist/index.html 에서 빈 root 를 찾지 못했어요.')

// 글자 안의 $ 가 치환 문법으로 해석되지 않도록 함수로 넘김
await writeFile('dist/index.html', html.replace(empty_root, () => `<div id="root">${render()}</div>`))
await rm('dist-server', { recursive: true })
