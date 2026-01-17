import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import LibraryOptimized from './LibraryOptimized'

const noop = () => {}

test('renders optimized library hero', () => {
  render(
    <I18nProvider>
      <LibraryOptimized localItems={[]} onImport={noop} onRemove={noop} />
    </I18nProvider>
  )

  expect(screen.getByText('Curate your quiet library.')).toBeInTheDocument()
  expect(screen.getByText('Local Imports')).toBeInTheDocument()
})
