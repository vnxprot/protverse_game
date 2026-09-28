import test from 'node:test'
import assert from 'node:assert/strict'
import { getSceneNarration, initialSave } from '../src/story.ts'

test('lời kể của cảnh sau thay đổi theo lựa chọn trước và biến cố', () => {
  const shy = { ...initialSave, sceneIndex: 1, choices: [{ sceneId: 'paper-star', choiceIndex: 2, at: '2026-01-01' }] }
  const candid = { ...initialSave, sceneIndex: 1, choices: [{ sceneId: 'paper-star', choiceIndex: 0, at: '2026-01-01' }] }
  assert.notEqual(getSceneNarration(shy), getSceneNarration(candid))
  const night = { ...initialSave, sceneIndex: 4, meteorChoice: 'step-out' }
  assert.match(getSceneNarration(night), /một tối chỉ có mình/)
})
