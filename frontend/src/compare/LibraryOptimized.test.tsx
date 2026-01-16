import { render, screen } from '@testing-library/react'
import LibraryOptimized from './LibraryOptimized'

const noop = () => {}

test('renders optimized library hero', () => {
  render(
    <LibraryOptimized localItems={[]} onImport={noop} onRemove={noop} />
  )

  expect(screen.getByText('Curate your quiet library.')).toBeInTheDocument()
  expect(screen.getByText('Local Imports')).toBeInTheDocument()
})
