import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../components/I18nProvider'
import LibraryOptimized from './LibraryOptimized'

const noop = () => {}

test('renders optimized library hero', () => {
  render(
    <MemoryRouter>
      <I18nProvider>
        <LibraryOptimized
          localItems={[]}
          remoteItems={[]}
          onImport={noop}
          onRemove={noop}
          onOpen={noop}
          onOpenRemote={noop}
        />
      </I18nProvider>
    </MemoryRouter>
  )

  expect(screen.getByText('Curate your quiet library.')).toBeInTheDocument()
  expect(screen.getByText('Local Imports')).toBeInTheDocument()
})
