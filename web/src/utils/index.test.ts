import { describe, it, expect } from 'vitest'
import { APP_NAME } from './index'

describe('utils', () => {
  it('exports APP_NAME constant', () => {
    expect(APP_NAME).toBe('Ghost Note')
  })
})
